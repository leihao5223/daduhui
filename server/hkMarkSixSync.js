/**
 * 外部开奖同步：marksix6 扩展接口含历史；单条接口为兜底；6g009 等需自建代理
 * 玩家侧延后展示/派彩：在业务服务上设置 HK6_LAG_SEC（秒），相对源的 openTime（drawnAt）。
 */
const DEFAULT_SYNC_URL = 'https://marksix6.net/api/lottery_api.php';
/** 含 lottery_data[].history 的完整 JSON */
const DEFAULT_EXTENDED_SYNC_URL = 'https://marksix6.net/index.php?api=1';
const EXTENDED_MIRROR_URLS = ['https://api.marksix6.net/index.php?api=1'];
const QUICK_MIRROR_URLS = ['https://api.marksix6.net/api/lottery_api.php'];

let lastExternalAttemptMs = 0;
const EXTERNAL_MIN_INTERVAL_MS = Number(process.env.HK6_SYNC_MIN_MS || 28000);

/** 合并并发中的 ingest，避免多路轮询各自命中 28s 节流返回空列表 */
let ingestInFlight = null;

function maxStoredDraws() {
  const n = Number(process.env.HK6_MAX_DRAWS || 200);
  return Math.min(Math.max(n, 1), 500);
}

function pad2(n) {
  const x = Number(String(n).trim());
  if (!Number.isFinite(x) || x < 1 || x > 49) return null;
  return String(x).padStart(2, '0');
}

function periodNum(p) {
  const m = /^HK(\d+)$/.exec(String(p || ''));
  return m ? Number(m[1]) : 0;
}

function numbersFromOpenCode(openCode) {
  const sly = String(openCode || '')
    .trim()
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (sly.length < 7) return null;
  return sly;
}

function rowFromExpectNumbers(expect, numbers, openTime, openCode) {
  const expectStr = String(expect || '').trim();
  if (!expectStr) return null;
  let nums = Array.isArray(numbers) ? numbers : null;
  if (!nums || nums.length < 7) {
    const oc = numbersFromOpenCode(openCode);
    if (oc) nums = oc;
  }
  if (!nums || nums.length < 7) return null;
  const raw = nums.map((x) => pad2(x));
  if (raw.some((x) => !x)) return null;
  const balls = raw.slice(0, 6);
  const special = raw[6];
  let drawnAt = null;
  if (openTime) {
    const t = String(openTime).replace(/\//g, '-');
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) drawnAt = d.toISOString();
  }
  return { period: `HK${expectStr}`, balls, special, drawnAt };
}

/** lottery_data 里单条香港彩 */
function rowFromExtendedLotteryRow(row) {
  if (!row) return null;
  return rowFromExpectNumbers(row.expect, row.numbers, row.openTime, row.openCode);
}

/** marksix6.net：hk.numbers 为 7 个两位串，前 6 正码顺序，第 7 特码 */
function normalizeFromMarksix6(json) {
  const hk = json && json.hk;
  if (!hk) return null;
  return rowFromExpectNumbers(hk.expect, hk.numbers, hk.openTime, hk.openCode);
}

/** 历史行：2026045 期：21,42,46,36,04,16,09 */
function parseHistoryLine(line) {
  const m = /^(\d+)\s*期\s*[：:]\s*([\d,\s，]+)$/.exec(String(line || '').trim());
  if (!m) return null;
  const parts = m[2]
    .split(/[,，]/)
    .map((s) => pad2(s.trim()))
    .filter(Boolean);
  if (parts.length !== 7) return null;
  return {
    period: `HK${m[1]}`,
    balls: parts.slice(0, 6),
    special: parts[6],
    drawnAt: null,
  };
}

function parseMarksix6ExtendedPayload(json) {
  const list = (json && json.lottery_data) || [];
  const row = list.find((x) => x && String(x.code || '').toLowerCase() === 'hk');
  if (!row) return null;
  const byPeriod = new Map();
  const add = (r) => {
    if (r && r.period) byPeriod.set(r.period, r);
  };
  add(rowFromExtendedLotteryRow(row));
  for (const line of row.history || []) {
    const h = parseHistoryLine(line);
    if (h) add(h);
  }
  const sorted = [...byPeriod.values()].sort((a, b) => periodNum(a.period) - periodNum(b.period));
  const cap = maxStoredDraws();
  return sorted.length <= cap ? sorted : sorted.slice(-cap);
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

function parseJsonFromBody(raw) {
  if (raw == null) return null;
  const t = String(raw).replace(/^\uFEFF/, '').trim();
  if (!t || t.startsWith('<')) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
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
    const text = await res.text();
    return parseJsonFromBody(text);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extendedSyncUrl() {
  const env = process.env.HK6_EXTENDED_SYNC_URL;
  if (env === '') return '';
  return (env || DEFAULT_EXTENDED_SYNC_URL).trim();
}

/** 仅在「未强制自定义扩展地址」时追加镜像，避免拉到别家数据结构 */
function extendedFetchUrls() {
  const primary = extendedSyncUrl();
  if (!primary) return [];
  const urls = [primary];
  const locked = Boolean(process.env.HK6_EXTENDED_SYNC_URL && process.env.HK6_EXTENDED_SYNC_URL.trim());
  if (!locked) {
    for (const m of EXTENDED_MIRROR_URLS) {
      if (!urls.includes(m)) urls.push(m);
    }
  }
  return urls;
}

function quickFetchUrls() {
  const custom = (process.env.HK6_SYNC_URL || '').trim();
  if (custom) return [custom];
  const urls = [DEFAULT_SYNC_URL];
  for (const m of QUICK_MIRROR_URLS) {
    if (!urls.includes(m)) urls.push(m);
  }
  return urls;
}

function drawEquals(a, b) {
  if (!a || !b) return false;
  if (a.period !== b.period) return false;
  if (a.special !== b.special) return false;
  if (!Array.isArray(a.balls) || !Array.isArray(b.balls) || a.balls.length !== b.balls.length) return false;
  return a.balls.every((x, i) => x === b.balls[i]);
}

function listDrawsEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((row, i) => drawEquals(row, b[i]));
}

function mergeExtendedIntoStore(store, incomingChronological, saveStore, settleFn, sourceTag) {
  const cap = maxStoredDraws();
  const oldList = store.hkMarkSix.draws;
  const oldPeriods = new Set(oldList.map((d) => d.period));
  const merged = new Map();
  const stamp = new Date().toISOString();
  for (const d of oldList) merged.set(d.period, { ...d });
  for (const d of incomingChronological) {
    const prev = merged.get(d.period);
    merged.set(d.period, {
      ...d,
      ingestedAt: d.ingestedAt || prev?.ingestedAt || stamp,
    });
  }
  let next = [...merged.keys()]
    .sort((a, b) => periodNum(a) - periodNum(b))
    .map((p) => merged.get(p));
  if (next.length > cap) next = next.slice(-cap);

  if (listDrawsEqual(next, oldList)) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncSource = sourceTag;
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    store.hkMarkSix.meta.lastSyncError = null;
    return { updated: false };
  }

  const newOnes = next
    .filter((r) => !oldPeriods.has(r.period))
    .sort((a, b) => periodNum(a.period) - periodNum(b.period));

  store.hkMarkSix.draws = next;
  if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
  store.hkMarkSix.meta.lastSyncSource = sourceTag;
  store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
  store.hkMarkSix.meta.lastSyncError = null;
  saveStore();
  for (const r of newOnes) settleFn(store, r, saveStore);
  return { updated: true };
}

async function fetchExternalDrawRow() {
  for (const url of quickFetchUrls()) {
    const json = await fetchJsonUrl(url);
    if (!json) continue;
    if (process.env.HK6_SYNC_MODE === 'raw') {
      const r = normalizeRaw(json);
      if (r) return r;
      continue;
    }
    const row = normalizeFromMarksix6(json);
    if (row) return row;
    const raw = normalizeRaw(json);
    if (raw) return raw;
  }
  return null;
}

/**
 * @returns {Promise<{ updated: boolean, row?: object, error?: string }>}
 */
async function tryIngestExternalDrawImpl(store, saveStore, settleFn) {
  if (process.env.HK6_EXTERNAL_SYNC === '0') {
    return { updated: false };
  }
  const now = Date.now();
  const hasDraws = store.hkMarkSix.draws.length > 0;
  const throttleOk = !hasDraws || now - lastExternalAttemptMs >= EXTERNAL_MIN_INTERVAL_MS;
  if (!throttleOk) {
    return { updated: false };
  }
  lastExternalAttemptMs = now;

  if (process.env.HK6_SYNC_MODE !== 'raw') {
    for (const extUrl of extendedFetchUrls()) {
      const extJson = await fetchJsonUrl(extUrl, 15000);
      const incoming = extJson && parseMarksix6ExtendedPayload(extJson);
      if (incoming && incoming.length) {
        const r = mergeExtendedIntoStore(store, incoming, saveStore, settleFn, 'marksix6-extended');
        return r.updated ? { updated: true } : { updated: false };
      }
    }
  }

  const row = await fetchExternalDrawRow();
  if (!row) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncError = 'fetch_failed';
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    return { updated: false, error: 'fetch_failed' };
  }

  const { _source, ...cleanRow } = row;
  if (!cleanRow.ingestedAt) cleanRow.ingestedAt = new Date().toISOString();
  const last = store.hkMarkSix.draws[store.hkMarkSix.draws.length - 1];
  if (last && drawEquals(last, cleanRow)) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncSource = _source || 'marksix6';
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    store.hkMarkSix.meta.lastSyncError = null;
    return { updated: false };
  }

  if (last && periodNum(last.period) >= periodNum(cleanRow.period)) {
    if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
    store.hkMarkSix.meta.lastSyncSource = _source || 'marksix6';
    store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
    store.hkMarkSix.meta.lastSyncError = 'period_not_newer';
    return { updated: false };
  }

  store.hkMarkSix.draws.push(cleanRow);
  const cap = maxStoredDraws();
  if (store.hkMarkSix.draws.length > cap) {
    store.hkMarkSix.draws.splice(0, store.hkMarkSix.draws.length - cap);
  }
  if (!store.hkMarkSix.meta) store.hkMarkSix.meta = {};
  store.hkMarkSix.meta.lastSyncSource = _source || 'marksix6';
  store.hkMarkSix.meta.lastSyncAt = new Date().toISOString();
  store.hkMarkSix.meta.lastSyncError = null;
  saveStore();
  settleFn(store, cleanRow, saveStore);
  return { updated: true, row: cleanRow };
}

async function tryIngestExternalDraw(store, saveStore, settleFn) {
  if (process.env.HK6_EXTERNAL_SYNC === '0') {
    return { updated: false };
  }
  if (ingestInFlight) {
    return ingestInFlight;
  }
  ingestInFlight = (async () => {
    try {
      return await tryIngestExternalDrawImpl(store, saveStore, settleFn);
    } finally {
      ingestInFlight = null;
    }
  })();
  return ingestInFlight;
}

module.exports = {
  tryIngestExternalDraw,
  fetchExternalDrawRow,
  DEFAULT_SYNC_URL,
  DEFAULT_EXTENDED_SYNC_URL,
};
