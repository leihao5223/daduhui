/**
 * Draws, bets, and settlement (three digits 0–9).
 */
const crypto = require('crypto');
const rules = require('./canada28Rules');
const finance = require('./finance');
const canada28Sync = require('./canada28Sync');
const ca28SyncConfig = require('./ca28SyncConfig');
const gameRoomFeed = require('./gameRoomFeed');

const CYCLE_SEC = Number(process.env.CA28_CYCLE_SEC || 210); // 3.5 分钟

function maxDrawCap() {
  return ca28SyncConfig.maxStoredDraws();
}

function ensureCanada28(store) {
  if (!store.canada28 || typeof store.canada28 !== 'object') {
    store.canada28 = {
      periodBase: 20260501000,
      draws: [],
      bets: [],
    };
  }
  if (!Array.isArray(store.canada28.draws)) store.canada28.draws = [];
  if (!Array.isArray(store.canada28.bets)) store.canada28.bets = [];
  if (typeof store.canada28.periodBase !== 'number') store.canada28.periodBase = 20260501000;

  const useExternal = process.env.CA28_EXTERNAL_SYNC !== '0';
  if (store.canada28.draws.length === 0 && !useExternal) {
    store.canada28.draws.push({
      period: 'CA2820260501000',
      digits: [1, 2, 7],
      drawnAt: new Date(Date.now() - CYCLE_SEC * 1000).toISOString(),
      ingestedAt: new Date(Date.now() - CYCLE_SEC * 1000).toISOString(),
    });
  }
}

function periodNum(p) {
  const m = /^CA28(\d+)$/.exec(String(p || ''));
  return m ? Number(m[1]) : 0;
}

function fakeDigits(seed) {
  const a = Math.floor(Math.abs(Math.sin(seed)) * 10) % 10;
  const b = Math.floor(Math.abs(Math.cos(seed * 1.7)) * 10) % 10;
  const c = Math.floor(Math.abs(Math.sin(seed * 2.3)) * 10) % 10;
  return [a, b, c];
}

function appendRandomFallbackDraw(store, saveStore, settleFn) {
  ensureCanada28(store);
  if (process.env.CA28_RANDOM_FALLBACK === '0') return;
  if (store.canada28.draws.length > 0) return;
  const lastN = store.canada28.periodBase;
  const nextPeriod = `CA28${lastN + 1}`;
  const seed = Number((crypto.randomBytes(6).readUIntBE(0, 6) + Date.now()) % 1_000_000_000);
  const digits = fakeDigits(seed);
  const drawRow = {
    period: nextPeriod,
    digits,
    drawnAt: new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  };
  store.canada28.draws.push(drawRow);
  if (!store.canada28.meta) store.canada28.meta = {};
  store.canada28.meta.lastSyncSource = 'local';
  store.canada28.meta.lastSyncAt = new Date().toISOString();
  saveStore();
  settleFn(store, drawRow, saveStore);
}

function maybeAdvanceIntervalDraw(store, saveStore, settleFn) {
  ensureCanada28(store);
  if (process.env.CA28_DEMO_TIMER !== '1') return;
  const now = Math.floor(Date.now() / 1000);
  if (!store.canada28._rollBucket) store.canada28._rollBucket = Math.floor(now / CYCLE_SEC);
  const bucket = Math.floor(now / CYCLE_SEC);
  if (bucket <= store.canada28._rollBucket) return;
  store.canada28._rollBucket = bucket;
  const last = store.canada28.draws[store.canada28.draws.length - 1];
  const n = last ? periodNum(last.period) : store.canada28.periodBase;
  const nextPeriod = `CA28${n + 1}`;
  const digits = fakeDigits(bucket + n);
  const drawRow = {
    period: nextPeriod,
    digits,
    drawnAt: new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  };
  store.canada28.draws.push(drawRow);
  const cap = maxDrawCap();
  if (store.canada28.draws.length > cap) {
    store.canada28.draws.splice(0, store.canada28.draws.length - cap);
  }
  if (!store.canada28.meta) store.canada28.meta = {};
  store.canada28.meta.lastSyncSource = 'auto_roll';
  store.canada28.meta.lastSyncAt = new Date().toISOString();
  saveStore();
  settleFn(store, drawRow, saveStore);
}

function sumPeriodStakes(store, period) {
  let t = 0;
  for (const b of store.canada28.bets) {
    if (b.period === period && b.status === '已接单') t += Number(b.total) || 0;
  }
  return t;
}

function settleBetsForDraw(store, drawRow, saveStore) {
  ensureCanada28(store);
  const period = drawRow.period;
  const periodTotal = sumPeriodStakes(store, period);
  const pending = store.canada28.bets.filter((b) => b.period === period && b.status === '已接单');
  for (const bet of pending) {
    let gross = 0;
    for (const line of bet.lines) {
      const { gross: g } = rules.settleLine(line.key, line.stake, drawRow, periodTotal);
      gross += g;
    }
    const user = (store.users || []).find((u) => u.id === bet.userId);
    if (user && gross > 0) {
      user.balance = Number((Number(user.balance) + gross).toFixed(2));
      finance.appendLedgerEntry(store, user.id, {
        type: 'ca28_settle',
        title: 'PC28-派彩',
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

async function refreshDraws(store, saveStore) {
  ensureCanada28(store);
  maybeAdvanceIntervalDraw(store, saveStore, settleBetsForDraw);

  const hasUrl = ca28SyncConfig.remoteJsonUrl();
  if (process.env.CA28_EXTERNAL_SYNC !== '0' && hasUrl) {
    const r = await canada28Sync.tryIngestExternalDraw(store, saveStore, settleBetsForDraw);
    if (r.error === 'fetch_failed' && store.canada28.draws.length === 0) {
      appendRandomFallbackDraw(store, saveStore, settleBetsForDraw);
    }
    if (!r.updated && !store.canada28.draws.length && process.env.CA28_SYNC_FALLBACK_FAKE === '1') {
      appendRandomFallbackDraw(store, saveStore, settleBetsForDraw);
    }
  } else if (store.canada28.draws.length === 0) {
    appendRandomFallbackDraw(store, saveStore, settleBetsForDraw);
  }
}

async function touchSync(store, saveStore) {
  ensureCanada28(store);
  if (process.env.CA28_EXTERNAL_SYNC === '0') {
    await refreshDraws(store, saveStore);
    return;
  }
  if (store.canada28.draws.length > 0) {
    void refreshDraws(store, saveStore);
    return;
  }
  await refreshDraws(store, saveStore);
}

function nextPeriodFromStore(store) {
  ensureCanada28(store);
  const last = store.canada28.draws[store.canada28.draws.length - 1];
  if (!last) return null;
  const n = periodNum(last.period);
  return `CA28${n + 1}`;
}

function countdownSec(store) {
  ensureCanada28(store);
  const last = store.canada28.draws[store.canada28.draws.length - 1];
  if (!last || !last.drawnAt) return CYCLE_SEC;
  const t = new Date(last.drawnAt).getTime();
  if (Number.isNaN(t)) return CYCLE_SEC;
  const elapsed = (Date.now() - t) / 1000;
  const left = CYCLE_SEC - (elapsed % CYCLE_SEC);
  return Math.max(0, Math.floor(left));
}

function getStatus(store) {
  ensureCanada28(store);
  const last = store.canada28.draws[store.canada28.draws.length - 1];
  const derived = last ? rules.expandDrawForApi({ digits: last.digits }) : null;
  return {
    success: true,
    drawsCount: store.canada28.draws.length,
    currentPeriod: nextPeriodFromStore(store),
    countdownSec: countdownSec(store),
    cycleSec: CYCLE_SEC,
    lastDraw: last
      ? {
          period: last.period,
          digits: last.digits.map((d) => String(d)),
          sum: derived?.sum,
          drawnAt: last.drawnAt,
          derived,
        }
      : null,
    sync: {
      enabled: process.env.CA28_EXTERNAL_SYNC !== '0',
    },
  };
}

function getHistory(store, limitRaw) {
  ensureCanada28(store);
  const retention = maxDrawCap();
  const parsed = Number(limitRaw);
  const want = Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
  const lim = Math.min(Math.max(want, 1), retention, 800, store.canada28.draws.length);
  const list = [...store.canada28.draws].reverse().slice(0, lim);
  return {
    success: true,
    list: list.map((d) => {
      const derived = rules.expandDrawForApi({ digits: d.digits });
      return {
        period: d.period,
        nums: d.digits.join(','),
        sum: derived?.sum ?? null,
        time: d.drawnAt ? new Date(d.drawnAt).toLocaleString('zh-CN') : '—',
        derived,
      };
    }),
  };
}

function totalPoolForPeriod(store, period) {
  return sumPeriodStakes(store, period);
}

async function placeBet(store, userId, body, appendLedgerFn, saveStore, user) {
  await refreshDraws(store, saveStore);
  const periodNow = getStatus(store).currentPeriod;
  if (!periodNow) {
    return { ok: false, status: 503, body: { success: false, message: '开奖数据加载中，请稍后再试' } };
  }
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
  const poolBefore = totalPoolForPeriod(store, periodNow);
  let addTotal = 0;
  const byKind = { dxds: 0, zh: 0, jx: 0, other: 0 };
  const normalized = [];

  for (const { key, stake } of lines) {
    const v = rules.validateKey(key);
    if (!v.ok) {
      return { ok: false, status: 400, body: { success: false, message: v.message || '无效注项' } };
    }
    if (!Number.isFinite(stake) || stake <= 0) {
      return { ok: false, status: 400, body: { success: false, message: '每注金额须大于 0' } };
    }
    const cap = rules.capForKey(key);
    if (stake > cap) {
      return { ok: false, status: 400, body: { success: false, message: `单注超过玩法封顶 ${cap}` } };
    }
    const m = /^ca28:([^:]+):/.exec(key);
    const kind = m ? m[1] : '';
    if (kind === 'dx' || kind === 'ds') byKind.dxds += stake;
    else if (kind === 'zh') byKind.zh += stake;
    else if (kind === 'jx') byKind.jx += stake;
    else byKind.other += stake;
    addTotal += stake;
    const odds = rules.getBaseOdds(key);
    normalized.push({ key, stake, odds });
  }

  if (poolBefore + addTotal > rules.CAP_TOTAL) {
    return { ok: false, status: 400, body: { success: false, message: '本期总下注已超过 300000 封顶' } };
  }

  const total = addTotal;
  finance.ensureUserFinance(user, store);
  if (user.balance < total) {
    return { ok: false, status: 400, body: { success: false, message: '余额不足' } };
  }
  user.balance = Number((user.balance - total).toFixed(2));
  const betId = `ca28_${crypto.randomBytes(6).toString('hex')}`;
  store.canada28.bets.push({
    id: betId,
    userId,
    period: periodNow,
    lines: normalized,
    total,
    createdAt: new Date().toISOString(),
    status: '已接单',
  });
  if (store.canada28.bets.length > 25000) {
    store.canada28.bets.splice(0, store.canada28.bets.length - 25000);
  }
  appendLedgerFn(user.id, {
    type: 'ca28_bet',
    title: 'PC28-下注',
    delta: -total,
    balanceAfter: user.balance,
    meta: { betId, period: periodNow, lines: normalized },
  });
  gameRoomFeed.appendBetPair(store, 'canada-28', user.nickname, userId, periodNow, normalized, total, user.balance);
  saveStore();
  return {
    ok: true,
    body: {
      success: true,
      message: '下注成功',
      betId,
      period: periodNow,
      total,
    },
  };
}

function getUserRoomStats(store, userId) {
  ensureCanada28(store);
  const uid = String(userId || '');
  let turnover = 0;
  let pnl = 0;
  for (const b of store.canada28.bets) {
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

function getUserMonthPnl(store, userId) {
  ensureCanada28(store);
  const uid = String(userId || '');
  const s = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false });
  const cy = parseInt(s.slice(0, 4), 10);
  const cm = parseInt(s.slice(5, 7), 10) - 1;
  let pnl = 0;
  for (const b of store.canada28.bets) {
    if (String(b.userId) !== uid || b.status !== '已结算') continue;
    const ts = b.settledAt || b.createdAt;
    if (!ts) continue;
    const sv = new Date(ts).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false });
    const y = parseInt(sv.slice(0, 4), 10);
    const mo = parseInt(sv.slice(5, 7), 10) - 1;
    if (y !== cy || mo !== cm) continue;
    pnl += (Number(b.payout) || 0) - (Number(b.total) || 0);
  }
  return Number(pnl.toFixed(2));
}

module.exports = {
  ensureCanada28,
  touchSync,
  getStatus,
  getHistory,
  placeBet,
  settleBetsForDraw,
  getUserRoomStats,
  getUserMonthPnl,
};
