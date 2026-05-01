/**
 * 香港六合彩：状态、历史、下注（演示开奖节奏 + 持久化注单）
 */
const crypto = require('crypto');

/** 与前端 playCatalog 注项 key 一致：playTypeId:optionId */
const HK6_KEYS = new Set([
  'main-size:big',
  'main-size:small',
  'main-parity:odd',
  'main-parity:even',
  'main-combo:big-odd',
  'main-combo:big-even',
  'main-combo:small-odd',
  'main-combo:small-even',
  ...Array.from({ length: 12 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return `special-ball:ball-${n}`;
  }),
]);

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
  const nums = new Set();
  let k = 0;
  while (nums.size < 6) {
    const n = 1 + Math.floor((Math.abs(Math.sin(seed + k * 13)) * 10000) % 49);
    nums.add(String(n).padStart(2, '0'));
    k += 1;
  }
  const arr = [...nums].sort();
  const spec = 1 + Math.floor((Math.abs(Math.cos(seed)) * 10000) % 49);
  return { balls: arr, special: String(spec).padStart(2, '0') };
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

function maybeAdvanceDraw(store) {
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
    store.hkMarkSix.draws.push({
      period: nextPeriod,
      balls,
      special,
      drawnAt: new Date().toISOString(),
    });
    if (store.hkMarkSix.draws.length > 500) store.hkMarkSix.draws.splice(0, store.hkMarkSix.draws.length - 500);
  }
}

function placeBet(store, userId, body, appendLedgerFn, saveStore, user) {
  maybeAdvanceDraw(store);
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
    if (!HK6_KEYS.has(key)) {
      return { ok: false, status: 400, body: { success: false, message: `无效注项: ${key}` } };
    }
    if (!Number.isFinite(stake) || stake <= 0) {
      return { ok: false, status: 400, body: { success: false, message: '每注金额须大于 0' } };
    }
    total += stake;
    normalized.push({ key, stake });
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

module.exports = {
  HK6_KEYS,
  ensureHk6,
  getStatus,
  getHistory,
  maybeAdvanceDraw,
  placeBet,
};
