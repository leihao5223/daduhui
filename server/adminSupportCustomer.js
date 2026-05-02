/**
 * 客服后台：会话关联用户的资金与行为摘要
 */
const finance = require('./finance');
const speedRacing = require('./speedRacing');
const hkMarkSix = require('./hkMarkSix');
const canada28 = require('./canada28');

function countUserBets(store, userId) {
  const uid = String(userId || '');
  let n = 0;
  speedRacing.ensureSpeed(store);
  hkMarkSix.ensureHk6(store);
  canada28.ensureCanada28(store);
  for (const b of store.speedRacing.bets || []) {
    if (String(b.userId) === uid) n += 1;
  }
  for (const b of store.hkMarkSix.bets || []) {
    if (String(b.userId) === uid) n += 1;
  }
  for (const b of store.canada28.bets || []) {
    if (String(b.userId) === uid) n += 1;
  }
  return n;
}

function sumLedgerForUser(store, userId) {
  const uid = String(userId || '');
  let totalDeposit = 0;
  let totalWithdraw = 0;
  finance.ensureMeta(store);
  for (const r of store.ledger || []) {
    if (String(r.userId) !== uid) continue;
    const st = String(r.status || '');
    if (st !== '成功' && st !== '已完成') continue;
    const typ = String(r.type || '');
    const d = Number(r.delta) || 0;
    if (typ === 'deposit' && d > 0) totalDeposit += d;
    if (typ === 'withdraw' && d < 0) totalWithdraw += Math.abs(d);
  }
  return {
    totalDeposit: Number(totalDeposit.toFixed(2)),
    totalWithdraw: Number(totalWithdraw.toFixed(2)),
  };
}

function buildCustomerProfile(store, user) {
  if (!user) return null;
  finance.ensureUserFinance(user, store);
  const { totalDeposit, totalWithdraw } = sumLedgerForUser(store, user.id);
  const orderCount = countUserBets(store, user.id);
  const onlineSecondsTotal = Math.max(0, Math.floor(Number(user.onlineSecondsTotal) || 0));
  return {
    userId: user.id,
    nickname: user.nickname,
    displayId8: String(user.displayId8 || ''),
    customerNo: String(user.customerNo || ''),
    lastIp: String(user.lastIp || ''),
    lastIpAt: user.lastIpAt || null,
    totalDeposit,
    totalWithdraw,
    orderCount,
    onlineSecondsTotal,
  };
}

module.exports = { buildCustomerProfile, countUserBets };
