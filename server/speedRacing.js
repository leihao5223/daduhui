/**
 * 急速赛车：每期 1–10 排名，冠军号大小单双
 */
const crypto = require('crypto');
const finance = require('./finance');

const CYCLE_SEC = Number(process.env.SPEED_CYCLE_SEC || 75);

function ensureSpeed(store) {
  if (!store.speedRacing || typeof store.speedRacing !== 'object') {
    store.speedRacing = { periodBase: 20260501000, draws: [], bets: [] };
  }
  if (!Array.isArray(store.speedRacing.draws)) store.speedRacing.draws = [];
  if (!Array.isArray(store.speedRacing.bets)) store.speedRacing.bets = [];
}

function periodNum(p) {
  const m = /^SR(\d+)$/.exec(String(p || ''));
  return m ? Number(m[1]) : 0;
}

function shuffle(nums, seed) {
  const a = [...nums];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextDrawRanking(seed) {
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return shuffle(base, seed);
}

function settleLine(key, stake, champion) {
  const k = String(key || '').trim();
  const m = /^speed:(dx|ds):(\w+)$/.exec(k);
  if (!m) return { gross: 0 };
  const ch = Number(champion);
  if (!Number.isFinite(ch) || ch < 1 || ch > 10) return { gross: 0 };
  const big = ch >= 6;
  const small = ch <= 5;
  const odd = ch % 2 === 1;
  const even = !odd;
  const kind = m[1];
  const val = m[2];
  const mult = 1.95;
  if (kind === 'dx') {
    const win = val === 'big' ? big : small;
    return { gross: win ? stake * mult : 0 };
  }
  if (kind === 'ds') {
    const win = val === 'odd' ? odd : even;
    return { gross: win ? stake * mult : 0 };
  }
  return { gross: 0 };
}

function validateKey(key) {
  const m = /^speed:(dx|ds):(\w+)$/.exec(String(key || '').trim());
  if (!m) return { ok: false };
  if (m[1] === 'dx' && !['big', 'small'].includes(m[2])) return { ok: false };
  if (m[1] === 'ds' && !['odd', 'even'].includes(m[2])) return { ok: false };
  return { ok: true };
}

function settleBetsForDraw(store, drawRow, saveStore) {
  ensureSpeed(store);
  const period = drawRow.period;
  const champ = drawRow.ranking[0];
  const pending = store.speedRacing.bets.filter((b) => b.period === period && b.status === '已接单');
  for (const bet of pending) {
    let gross = 0;
    for (const line of bet.lines) {
      gross += settleLine(line.key, line.stake, champ).gross;
    }
    const user = (store.users || []).find((u) => u.id === bet.userId);
    if (user && gross > 0) {
      user.balance = Number((Number(user.balance) + gross).toFixed(2));
      finance.appendLedgerEntry(store, user.id, {
        type: 'speed_settle',
        title: '急速赛车-派彩',
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

function maybeAdvance(store, saveStore) {
  ensureSpeed(store);
  const now = Math.floor(Date.now() / 1000);
  if (!store.speedRacing._bucket) store.speedRacing._bucket = Math.floor(now / CYCLE_SEC);
  const bucket = Math.floor(now / CYCLE_SEC);
  if (bucket <= store.speedRacing._bucket) return;
  store.speedRacing._bucket = bucket;
  const last = store.speedRacing.draws[store.speedRacing.draws.length - 1];
  const n = last ? periodNum(last.period) : store.speedRacing.periodBase;
  const nextPeriod = `SR${n + 1}`;
  const ranking = nextDrawRanking(bucket + n);
  const drawRow = {
    period: nextPeriod,
    ranking,
    drawnAt: new Date().toISOString(),
  };
  store.speedRacing.draws.push(drawRow);
  const cap = 300;
  if (store.speedRacing.draws.length > cap) {
    store.speedRacing.draws.splice(0, store.speedRacing.draws.length - cap);
  }
  saveStore();
  settleBetsForDraw(store, drawRow, saveStore);
}

function touchSync(store, saveStore) {
  ensureSpeed(store);
  if (store.speedRacing.draws.length === 0) {
    const n = store.speedRacing.periodBase;
    const ranking = nextDrawRanking(Date.now() % 100000);
    store.speedRacing.draws.push({
      period: `SR${n}`,
      ranking,
      drawnAt: new Date(Date.now() - CYCLE_SEC * 1000).toISOString(),
    });
    saveStore();
  }
  maybeAdvance(store, saveStore);
}

function nextPeriod(store) {
  ensureSpeed(store);
  const last = store.speedRacing.draws[store.speedRacing.draws.length - 1];
  if (!last) return null;
  return `SR${periodNum(last.period) + 1}`;
}

function countdownSec(store) {
  ensureSpeed(store);
  const last = store.speedRacing.draws[store.speedRacing.draws.length - 1];
  if (!last || !last.drawnAt) return CYCLE_SEC;
  const t = new Date(last.drawnAt).getTime();
  const elapsed = (Date.now() - t) / 1000;
  const left = CYCLE_SEC - (elapsed % CYCLE_SEC);
  return Math.max(0, Math.floor(left));
}

function getStatus(store) {
  ensureSpeed(store);
  const last = store.speedRacing.draws[store.speedRacing.draws.length - 1];
  return {
    success: true,
    currentPeriod: nextPeriod(store),
    countdownSec: countdownSec(store),
    cycleSec: CYCLE_SEC,
    lastDraw: last
      ? {
          period: last.period,
          ranking: last.ranking,
          champion: last.ranking[0],
          drawnAt: last.drawnAt,
        }
      : null,
  };
}

function getHistory(store, limitRaw) {
  ensureSpeed(store);
  const lim = Math.min(Math.max(Number(limitRaw) || 100, 1), 300);
  const list = [...store.speedRacing.draws].reverse().slice(0, lim);
  return {
    success: true,
    list: list.map((d) => ({
      period: d.period,
      nums: d.ranking.join(','),
      champion: d.ranking[0],
      time: d.drawnAt ? new Date(d.drawnAt).toLocaleString('zh-CN') : '—',
    })),
  };
}

async function placeBet(store, userId, body, appendLedgerFn, saveStore, user) {
  touchSync(store, saveStore);
  const periodNow = getStatus(store).currentPeriod;
  if (!periodNow) {
    return { ok: false, status: 503, body: { success: false, message: '数据加载中' } };
  }
  const linesIn = Array.isArray(body.lines) ? body.lines : [];
  const lines = [];
  for (const raw of linesIn) {
    lines.push({ key: String(raw.key || '').trim(), stake: Number(raw.stake) });
  }
  if (!lines.length) {
    return { ok: false, status: 400, body: { success: false, message: '请选择注项' } };
  }
  let total = 0;
  const normalized = [];
  for (const { key, stake } of lines) {
    if (!validateKey(key).ok) {
      return { ok: false, status: 400, body: { success: false, message: `无效注项 ${key}` } };
    }
    if (!Number.isFinite(stake) || stake <= 0) {
      return { ok: false, status: 400, body: { success: false, message: '金额无效' } };
    }
    total += stake;
    normalized.push({ key, stake, odds: 1.95 });
  }
  finance.ensureUserFinance(user, store);
  if (user.balance < total) {
    return { ok: false, status: 400, body: { success: false, message: '余额不足' } };
  }
  user.balance = Number((user.balance - total).toFixed(2));
  const betId = `sr_${crypto.randomBytes(5).toString('hex')}`;
  store.speedRacing.bets.push({
    id: betId,
    userId,
    period: periodNow,
    lines: normalized,
    total,
    createdAt: new Date().toISOString(),
    status: '已接单',
  });
  appendLedgerFn(user.id, {
    type: 'speed_bet',
    title: '急速赛车-下注',
    delta: -total,
    balanceAfter: user.balance,
    meta: { betId, period: periodNow },
  });
  saveStore();
  return {
    ok: true,
    body: { success: true, message: '下注成功', betId, period: periodNow, total },
  };
}

function getUserRoomStats(store, userId) {
  ensureSpeed(store);
  const uid = String(userId || '');
  let turnover = 0;
  let pnl = 0;
  for (const b of store.speedRacing.bets) {
    if (String(b.userId) !== uid) continue;
    turnover += Number(b.total) || 0;
    if (b.status === '已结算') {
      pnl += (Number(b.payout) || 0) - (Number(b.total) || 0);
    }
  }
  return { turnover: Number(turnover.toFixed(2)), pnl: Number(pnl.toFixed(2)), rebate: null };
}

module.exports = {
  ensureSpeed,
  touchSync,
  getStatus,
  getHistory,
  placeBet,
  getUserRoomStats,
};
