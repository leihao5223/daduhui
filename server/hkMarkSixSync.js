/**
 * 外部开奖同步：默认 marksix6 公共 JSON；6g009 等为前端私有接口，需自建代理后设 HK6_SYNC_URL
 */
const DEFAULT_SYNC_URL = 'https://marksix6.net/api/lottery_api.php';

let lastExternalAttemptMs = 0;
const EXTERNAL_MIN_INTERVAL_MS = Number(process.env.HK6_SYNC_MIN_MS || 28000);

function pad2(n) {
  const x = Number(String(n).trim());
  if (!Number.isFinite(x) || x < 1 || x > 49) return null;
  return String(x).padStart(2, '0');
}

function periodNum(p) {
  const m = /^HK(\d+)$/.exec(String(p || ''));
  return m ? Number(m[1]) : 0;
}

/** marksix6.net：hk.numbers 为 7 个两位串，前 6 正码顺序，第 7 特码 */
function normalizeFromMarksix6(json) {
  const hk = json && json.hk;
  if (!hk || !Array.isArray(hk.numbers) || hk.numbers.length < 7) return null;
  const raw = hk.numbers.map((x) => pad2(x));
  if (raw.some((x) => !x)) return null;
  const balls = raw.slice(0, 6);
  const special = raw[6];
  const expect = String(hk.expect || '').trim();
  if (!expect) return null;
  let drawnAt = new Date().toISOString();
  if (hk.openTime) {
    const t = String(hk.openTime).replace(/\//g, '-');
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) drawnAt = d.toISOString();
  }
  return {
    period: `HK${expect}`,
    balls,
    special,
    drawnAt,
    _source: 'marksix6',
  };
}

/** 自建代理可返回：{ period: "HK2026046", balls: ["01",...], special: "12", drawnAt: ISO } */
function normalizeRaw(json) {
  if (!json || !json.period || !Array.isArray(json.balls) || json.balls.length !== 6) return null;
  const balls = json.balls.map((x) => pad2(x)).filter(Boolean);
  if (balls.length !== 6) return null;
  const special = pad2(json.special);
  if (!special) return null;
  const drawnAt =
    json.drawnAt && !Number.isNaN(new Date(json.drawnAt).getTime())
      ? new Date(json.drawnAt).toISOString()
      : new Date().toISOString();
  return {
    period: String(json.period).startsWith('HK') ? String(json.period) : `HK${json.period}`,
    balls,
    special,
    drawnAt,
    _source: 'raw',
  };
}

async function fetchJsonUrl(url, timeoutMs = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': process.env.HK6_SYNC_UA || 'Mozilla/5.0 (compatible; DaduhuiHK6/1.0)',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchExternalDrawRow() {
  const url = (process.env.HK6_SYNC_URL || DEFAULT_SYNC_URL).trim();
  if (!url) return null;
  const json = await fetchJsonUrl(url);
  if (!json) return null;
  if (process.env.HK6_SYNC_MODE === 'raw') return normalizeRaw(json);
  const row = normalizeFromMarksix6(json);
  if (row) return row;
  return normalizeRaw(json);
}

function drawEquals(a, b) {
  if (!a || !b) return false;
  if (a.period !== b.period) return false;
  if (a.special !== b.special) return false;
  if (!Array.isArray(a.balls) || !Array.isArray(b.balls) || a.balls.length !== b.balls.length) return false;
  return a.balls.every((x, i) => x === b.balls[i]);
}

/**
 * @returns {Promise<{ updated: boolean, row?: object, error?: string }>}
 */
async function tryIngestExternalDraw(store, saveStore, settleFn) {
  if (process.env.HK6_EXTERNAL_SYNC === '0') {
    return { updated: false };
  }
  const now = Date.now();
  if (now - lastExternalAttemptMs < EXTERNAL_MIN_INTERVAL_MS) {
    return { updated: false };
  }
  lastExternalAttemptMs = now;

  const row = await fetchExternalDrawRow();
  if (!row) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncError = 'fetch_failed';
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    return { updated: false, error: 'fetch_failed' };
  }

  const { _source, ...cleanRow } = row;
  const last = store.hkMarkSix.draws[store.hkMarkSix.draws.length - 1];
  if (last && drawEquals(last, cleanRow)) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncSource = _source;
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    store.hkMarkSix.meta.lastSyncError = null;
    return { updated: false };
  }

  if (last && periodNum(last.period) >= periodNum(cleanRow.period)) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncSource = _source;
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    store.hkMarkSix.meta.lastSyncError = 'period_not_newer';
    return { updated: false };
  }

  store.hkMarkSix.draws.push(cleanRow);
  if (store.hkMarkSix.draws.length > 500) {
    store.hkMarkSix.draws.splice(0, store.hkMarkSix.draws.length - 500);
  }
  if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
  store.hkMarkSix.meta.lastSyncSource = _source;
  store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
  store.hkMarkSix.meta.lastSyncError = null;
  saveStore();
  settleFn(store, cleanRow, saveStore);
  return { updated: true, row: cleanRow };
}

module.exports = {
  tryIngestExternalDraw,
  fetchExternalDrawRow,
  DEFAULT_SYNC_URL,
};
