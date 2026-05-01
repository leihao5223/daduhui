/**
 * 香港六合彩：状态、历史、下注、按规则结算
 */
const crypto = require('crypto');
const rules = require('./hkMarkSixRules');
const finance = require('./finance');

function ensureHk6(store) {
  if (!store.hkMarkSix || typeof store.hkMarkSix !== 'object') {
    store.hkMarkSix = { periodBase: 2026000, draws: [], bets: [] };
  }
  if (!Array.isArray(store.hkMarkSix.draws)) store.hkMarkSix.draws = [];
  if (!Array.isArray(store.hkMarkSix.bets)) store.hkMarkSix.bets = [];
  if (typeof store.hkMarkSix.periodBase !== 'number') store.hkMarkSix.periodBase = 2026000;
  if (store.hkMarkSix.draws.length === 0) {
    store.hkMarkSix.draws.push({
      period: 'HK2026000',
      balls: ['06', '12', '18', '22', '31', '44'],
      special: '02',
      drawnAt: new Date(Date.now() - 3600000).toISOString(),
    });
  }
}

function fakeBallsFromSeed(seed) {
  const arr = [];
  let k = 0;
  while (arr.length < 6) {
    const n = 1 + Math.floor((Math.abs(Math.sin(seed + k * 13)) * 10000) % 49);
    const s = String(n).padStart(2, '0');
    if (!arr.includes(s)) arr.push(s);
    k += 1;
  }
  const spec = 1 + Math.floor((Math.abs(Math.cos(seed)) * 10000) % 49);
  return { balls: arr, special: String(spec).padStart(2, '0') };
}

function settleBetsForCompletedDraw(store, drawRow, saveStore) {
  ensureHk6(store);
  const period = drawRow.period;
  const pending = store.hkMarkSix.bets.filter((b) => b.period === period && b.status === '已接单');
  for (const bet of pending) {
    let gross = 0;
    for (const line of bet.lines) {
      const odds = line.odds != null ? line.odds : rules.getDefaultOdds(line.key);
      const { payout } = rules.settleLine(line.key, line.stake, odds, {
        balls: drawRow.balls,
        special: drawRow.special,
      });
      gross += payout;
    }
    const user = (store.users || []).find((u) => u.id === bet.userId);
    if (user && gross > 0) {
      user.balance = Number((Number(user.balance) + gross).toFixed(2));
      finance.appendLedgerEntry(store, user.id, {
        type: 'hk6_settle',
        title: '香港六合彩-派彩',
        delta: gross,
        balanceAfter: user.balance,
        meta: { betId: bet.id, period },
      });
    }
    bet.status = '已结算';
    bet.payout = Number(gross.toFixed(2));
    bet.settledAt = new Date().toISOString();
  }
  if (pending.length) saveStore();
}

function getStatus(store) {
  ensureHk6(store);
  const cycle = 180;
  const now = Math.floor(Date.now() / 1000);
  const secInCycle = now % cycle;
  const countdownSec = cycle - secInCycle;
  const last = store.hkMarkSix.draws[store.hkMarkSix.draws.length - 1];
  const m = /^HK(\d+)$/.exec(String(last.period || ''));
  const n = m ? Number(m[1]) : store.hkMarkSix.periodBase;
  const nextPeriod = `HK${n + 1}`;
  return {
    success: true,
    currentPeriod: nextPeriod,
    countdownSec,
    lastDraw: {
      period: last.period,
      balls: last.balls,
      special: last.special,
      drawnAt: last.drawnAt,
    },
  };
}

function getHistory(store, limit) {
  ensureHk6(store);
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const list = [...store.hkMarkSix.draws].reverse().slice(0, lim);
  return {
    success: true,
    list: list.map((d) => ({
      period: d.period,
      balls: [...d.balls, d.special].join(','),
      numbers: { main: d.balls, special: d.special },
      time: new Date(d.drawnAt).toLocaleString('zh-CN'),
    })),
  };
}

function maybeAdvanceDraw(store, saveStore) {
  ensureHk6(store);
  const cycle = 180;
  const now = Math.floor(Date.now() / 1000);
  if (!store.hkMarkSix.lastRollBucket) store.hkMarkSix.lastRollBucket = Math.floor(now / cycle);
  const bucket = Math.floor(now / cycle);
  if (bucket > store.hkMarkSix.lastRollBucket) {
    store.hkMarkSix.lastRollBucket = bucket;
    const last = store.hkMarkSix.draws[store.hkMarkSix.draws.length - 1];
    const m = /^HK(\d+)$/.exec(String(last.period || ''));
    const n = m ? Number(m[1]) : store.hkMarkSix.periodBase;
    const nextPeriod = `HK${n + 1}`;
    const { special, balls } = fakeBallsFromSeed(bucket + n);
    const drawRow = {
      period: nextPeriod,
      balls,
      special,
      drawnAt: new Date().toISOString(),
    };
    store.hkMarkSix.draws.push(drawRow);
    if (store.hkMarkSix.draws.length > 500) store.hkMarkSix.draws.splice(0, store.hkMarkSix.draws.length - 500);
    saveStore();
    settleBetsForCompletedDraw(store, drawRow, saveStore);
  }
}

function placeBet(store, userId, body, appendLedgerFn, saveStore, user) {
  maybeAdvanceDraw(store, saveStore);
  const linesIn = Array.isArray(body.lines) ? body.lines : [];
  const lines = [];
  for (const raw of linesIn) {
    const key = String(raw.key || '').trim();
    const stake = Number(raw.stake);
    lines.push({ key, stake });
  }
  if (lines.length === 0) {
    return { ok: false, status: 400, body: { success: false, message: '请选择注项' } };
  }
  let total = 0;
  const normalized = [];
  for (const { key, stake } of lines) {
    if (!rules.validateHk6Key(key).ok) {
      return { ok: false, status: 400, body: { success: false, message: `无效注项: ${key}` } };
    }
    if (!Number.isFinite(stake) || stake <= 0) {
      return { ok: false, status: 400, body: { success: false, message: '每注金额须大于 0' } };
    }
    const odds = rules.getDefaultOdds(key);
    total += stake;
    normalized.push({ key, stake, odds });
  }
  const totalAmount = body.totalAmount != null ? Number(body.totalAmount) : null;
  if (totalAmount != null && Math.abs(totalAmount - total) > 0.001) {
    return { ok: false, status: 400, body: { success: false, message: '金额合计不一致' } };
  }
  if (user.balance < total) {
    return { ok: false, status: 400, body: { success: false, message: '余额不足' } };
  }
  user.balance = Number((user.balance - total).toFixed(2));
  const betId = `hk6_${crypto.randomBytes(6).toString('hex')}`;
  const period = getStatus(store).currentPeriod;
  store.hkMarkSix.bets.push({
    id: betId,
    userId,
    period,
    lines: normalized,
    total,
    createdAt: new Date().toISOString(),
    status: '已接单',
  });
  if (store.hkMarkSix.bets.length > 20000) {
    store.hkMarkSix.bets.splice(0, store.hkMarkSix.bets.length - 20000);
  }
  appendLedgerFn(user.id, {
    type: 'hk6_bet',
    title: '香港六合彩-下注',
    delta: -total,
    balanceAfter: user.balance,
    meta: { betId, period, lines: normalized },
  });
  saveStore();
  return {
    ok: true,
    body: {
      success: true,
      message: '下注成功',
      betId,
      period,
      total,
    },
  };
}

function getUserRoomStats(store, userId) {
  ensureHk6(store);
  const uid = String(userId || '');
  let turnover = 0;
  let pnl = 0;
  for (const b of store.hkMarkSix.bets) {
    if (String(b.userId) !== uid) continue;
    turnover += Number(b.total) || 0;
    if (b.status === '已结算') {
      pnl += (Number(b.payout) || 0) - (Number(b.total) || 0);
    }
  }
  return {
    turnover: Number(turnover.toFixed(2)),
    pnl: Number(pnl.toFixed(2)),
    rebate: null,
  };
}

module.exports = {
  ensureHk6,
  getStatus,
  getHistory,
  maybeAdvanceDraw,
  placeBet,
  getUserRoomStats,
  settleBetsForCompletedDraw,
};
