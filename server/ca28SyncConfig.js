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

module.exports = {
  remoteJsonUrl,
  syncUserAgent,
  minIntervalMs,
};
