/**
 * 用户资金：余额、流水（与前端 Profile / 提现 / 资金记录对齐）
 */
const crypto = require('crypto');

function ensureMeta(store) {
  if (!store.meta || typeof store.meta !== 'object') store.meta = {};
  if (typeof store.meta.nextCustomerNo !== 'number' || store.meta.nextCustomerNo < 100000) {
    const max = (store.users || []).reduce((m, u) => Math.max(m, Number(u.customerNo) || 0), 0);
    store.meta.nextCustomerNo = Math.max(100001, max + 1);
  }
  if (!Array.isArray(store.ledger)) store.ledger = [];
}

function ensureUserFinance(user, store) {
  ensureMeta(store);
  if (typeof user.balance !== 'number' || !Number.isFinite(user.balance)) user.balance = 0;
  if (user.customerNo == null || user.customerNo === '') {
    user.customerNo = store.meta.nextCustomerNo++;
  }
}

function maskNickname(nick) {
  const s = String(nick || '').trim();
  if (!s) return '用**';
  return `${s.slice(0, 1)}**`;
}

function appendLedgerEntry(store, userId, entry) {
  ensureMeta(store);
  const row = {
    id: `tx_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    type: String(entry.type || 'misc'),
    title: String(entry.title || ''),
    delta: Number(entry.delta) || 0,
    balanceAfter: Number(entry.balanceAfter) || 0,
    status: String(entry.status || '成功'),
    createdAt: new Date().toISOString(),
    meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : {},
  };
  store.ledger.push(row);
  if (store.ledger.length > 50000) {
    store.ledger.splice(0, store.ledger.length - 50000);
  }
  return row;
}

function buildMeSummary(user, store) {
  ensureUserFinance(user, store);
  return {
    success: true,
    data: {
      nameMask: maskNickname(user.nickname),
      customerNo: String(user.customerNo),
      userId: user.id,
      totalAsset: Number(user.balance.toFixed(2)),
      available: Number(user.balance.toFixed(2)),
      frozen: 0,
      currency: 'CNY',
      creditScore: 100,
      accountPnl: 0,
      todayPnl: 0,
    },
  };
}

function listWalletRecords(store, userId, { limit = 100 } = {}) {
  ensureMeta(store);
  const rows = (store.ledger || [])
    .filter((x) => x.userId === userId)
    .slice(-limit)
    .reverse();
  return rows.map((r) => ({
    id: r.id,
    time: new Date(r.createdAt).toLocaleString('zh-CN'),
    type: r.title || r.type,
    amount: `${r.delta >= 0 ? '+' : ''}${Number(r.delta).toFixed(2)}`,
    status: r.status,
  }));
}

module.exports = {
  ensureMeta,
  ensureUserFinance,
  buildMeSummary,
  appendLedgerEntry,
  listWalletRecords,
};
