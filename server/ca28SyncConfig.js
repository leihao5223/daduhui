/**
 * Remote draw JSON endpoint (optional). Primary: DDH_CA28_REMOTE_URL; legacy alias still honored.
 */
function remoteJsonUrl() {
  return String(process.env.DDH_CA28_REMOTE_URL || process.env.CA28_SYNC_URL || '').trim();
}

function syncUserAgent() {
  return process.env.DDH_CA28_FETCH_UA || process.env.CA28_SYNC_UA || 'Mozilla/5.0 (compatible; SyncClient/1.0)';
}

function minIntervalMs() {
  return Number(process.env.DDH_CA28_FETCH_MIN_MS || process.env.CA28_SYNC_MIN_MS || 8000);
}

/** 内存中保留的开奖条数上限；下限 200 以便历史接口可返回最近 200 条 */
function maxStoredDraws() {
  const n = Number(process.env.CA28_MAX_DRAWS || 500);
  return Math.min(Math.max(n, 200), 800);
}

module.exports = {
  remoteJsonUrl,
  syncUserAgent,
  minIntervalMs,
  maxStoredDraws,
};
