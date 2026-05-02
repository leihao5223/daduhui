/**
 * 管理后台聚合统计（大都汇 store.json）
 */
const finance = require('./finance');
const hkMarkSix = require('./hkMarkSix');
const canada28 = require('./canada28');
const speedRacing = require('./speedRacing');

function inShanghaiNaturalDay(iso, ymd) {
  const t0 = Date.parse(`${ymd}T00:00:00+08:00`);
  const t1 = Date.parse(`${ymd}T23:59:59.999+08:00`);
  const ts = new Date(iso).getTime();
  return Number.isFinite(t0) && ts >= t0 && ts <= t1;
}

function dashboardStats(store, sessionCount) {
  finance.ensureMeta(store);
  hkMarkSix.ensureHk6(store);
  canada28.ensureCanada28(store);
  speedRacing.ensureSpeed(store);
  const ymd = finance.shanghaiTodayYmd();
  let depositsToday = 0;
  let withdrawalsToday = 0;
  for (const r of store.ledger || []) {
    if (!inShanghaiNaturalDay(r.createdAt, ymd)) continue;
    if (String(r.type) === 'deposit') depositsToday += Number(r.delta) || 0;
    if (String(r.type) === 'withdraw') withdrawalsToday += Math.abs(Number(r.delta) || 0);
  }
  let activeOrders = 0;
  let ordersSettledToday = 0;
  const scan = (arr) => {
    for (const b of arr || []) {
      if (String(b.status) === '已接单') activeOrders += 1;
      if (String(b.status) === '已结算') {
        const at = b.settledAt || b.createdAt;
        if (inShanghaiNaturalDay(at, ymd)) ordersSettledToday += 1;
      }
    }
  };
  scan(store.hkMarkSix && store.hkMarkSix.bets);
  scan(store.canada28 && store.canada28.bets);
  scan(store.speedRacing && store.speedRacing.bets);
  return {
    usersTotal: (store.users || []).length,
    onlineNow: Math.max(0, Number(sessionCount) || 0),
    depositsToday: Number(depositsToday.toFixed(2)),
    withdrawalsToday: Number(withdrawalsToday.toFixed(2)),
    activeOrders,
    ordersSettledToday,
  };
}

module.exports = { dashboardStats };
