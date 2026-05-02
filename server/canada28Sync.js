/**
 * Ingest remote draws from configured JSON HTTP endpoint.
 */
const ca28SyncConfig = require('./ca28SyncConfig');

let lastAttemptMs = 0;

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
        Accept: 'application/json,*/*',
        'User-Agent': ca28SyncConfig.syncUserAgent(),
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

function padPeriod(p) {
  const s = String(p || '').trim();
  if (!s) return null;
  return s.toUpperCase().startsWith('CA28') ? s : `CA28${s}`;
}

function normalizeRow(json) {
  if (!json || typeof json !== 'object') return null;
  let digits = null;
  if (Array.isArray(json.digits) && json.digits.length >= 3) {
    digits = json.digits.slice(0, 3).map((x) => Math.trunc(Number(x)));
  } else if (json.openCode != null) {
    digits = String(json.openCode)
      .split(/[,，+\s]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((x) => Math.trunc(Number(x)));
  }
  if (!digits || digits.length !== 3 || digits.some((n) => !Number.isFinite(n) || n < 0 || n > 9)) {
    return null;
  }
  const period = padPeriod(json.period || json.expect || json.issue);
  if (!period) return null;
  const drawnAt =
    json.drawnAt && !Number.isNaN(new Date(json.drawnAt).getTime())
      ? new Date(json.drawnAt).toISOString()
      : new Date().toISOString();
  return {
    period,
    digits,
    drawnAt,
    ingestedAt: new Date().toISOString(),
  };
}

function periodNum(p) {
  const m = /^CA28(\d+)$/.exec(String(p || ''));
  return m ? Number(m[1]) : 0;
}

async function tryIngestExternalDraw(store, saveStore, settleFn) {
  if (process.env.CA28_EXTERNAL_SYNC === '0') {
    return { updated: false };
  }
  const url = ca28SyncConfig.remoteJsonUrl();
  if (!url) {
    return { updated: false, error: 'no_sync_url' };
  }
  const now = Date.now();
  const minMs = ca28SyncConfig.minIntervalMs();
  if (now - lastAttemptMs < minMs) {
    return { updated: false };
  }
  lastAttemptMs = now;

  const json = await fetchJsonUrl(url, 15000);
  if (!json) {
    if (!store.canada28.meta) store.canada28.meta = {};
    store.canada28.meta.lastSyncError = 'fetch_failed';
    store.canada28.meta.lastSyncAt = new Date().toISOString();
    return { updated: false, error: 'fetch_failed' };
  }

  const row = normalizeRow(json);
  if (!row) {
    if (!store.canada28.meta) store.canada28.meta = {};
    store.canada28.meta.lastSyncError = 'bad_payload';
    store.canada28.meta.lastSyncAt = new Date().toISOString();
    return { updated: false, error: 'bad_payload' };
  }

  const last = store.canada28.draws[store.canada28.draws.length - 1];
  if (last && last.period === row.period) {
    const same =
      Array.isArray(last.digits) &&
      last.digits.length === 3 &&
      row.digits.every((d, i) => d === last.digits[i]);
    if (same) {
      if (!store.canada28.meta) store.canada28.meta = {};
      store.canada28.meta.lastSyncSource = 'remote';
      store.canada28.meta.lastSyncError = null;
      store.canada28.meta.lastSyncAt = new Date().toISOString();
      return { updated: false };
    }
  }
  if (last && periodNum(last.period) >= periodNum(row.period)) {
    if (!store.canada28.meta) store.canada28.meta = {};
    store.canada28.meta.lastSyncError = 'period_not_newer';
    store.canada28.meta.lastSyncAt = new Date().toISOString();
    return { updated: false };
  }

  store.canada28.draws.push(row);
  const cap = Number(process.env.CA28_MAX_DRAWS || 500);
  if (store.canada28.draws.length > cap) {
    store.canada28.draws.splice(0, store.canada28.draws.length - cap);
  }
  if (!store.canada28.meta) store.canada28.meta = {};
  store.canada28.meta.lastSyncSource = 'remote';
  store.canada28.meta.lastSyncError = null;
  store.canada28.meta.lastSyncAt = new Date().toISOString();
  saveStore();
  settleFn(store, row, saveStore);
  return { updated: true, row };
}

module.exports = {
  tryIngestExternalDraw,
  normalizeRow,
};
