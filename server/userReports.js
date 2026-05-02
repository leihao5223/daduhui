/**
 * 个人报表：合并各游戏下注单（按 Asia/Shanghai 自然日筛选）
 */
const hkMarkSix = require('./hkMarkSix');
const canada28 = require('./canada28');
const speedRacing = require('./speedRacing');

function shanghaiTodayYmd() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).slice(0, 10);
}

function inShanghaiDayRange(iso, fromYmd, toYmd) {
  const f = fromYmd || shanghaiTodayYmd();
  const t = toYmd || f;
  const t0 = Date.parse(`${f}T00:00:00+08:00`);
  const t1 = Date.parse(`${t}T23:59:59.999+08:00`);
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return true;
  const ts = new Date(iso).getTime();
  return ts >= t0 && ts <= t1;
}

function summarizeLines(lines, maxShow) {
  const max = maxShow || 4;
  if (!Array.isArray(lines) || !lines.length) return '—';
  const parts = lines.slice(0, max).map((l) => {
    const k = String(l.key || '');
    const st = Number(l.stake);
    return `${k}×${Number.isFinite(st) ? st.toFixed(0) : '0'}`;
  });
  const tail = lines.length > max ? ` …共${lines.length}注` : '';
  return parts.join('；') + tail;
}

function listBetOrders(store, userId, fromYmd, toYmd, limitRaw) {
  const uid = String(userId || '');
  const lim = Math.min(Math.max(Number(limitRaw) || 500, 1), 2000);
  const f = fromYmd || shanghaiTodayYmd();
  const t = toYmd || f;

  hkMarkSix.ensureHk6(store);
  canada28.ensureCanada28(store);
  speedRacing.ensureSpeed(store);

  const out = [];

  for (const b of store.hkMarkSix.bets || []) {
    if (String(b.userId) !== uid) continue;
    if (!inShanghaiDayRange(b.createdAt, f, t)) continue;
    out.push({
      id: b.id,
      game: 'hk6',
      gameLabel: '香港六合彩',
      period: b.period,
      amount: Number(b.total) || 0,
      status: b.status,
      payout: b.payout != null ? Number(b.payout) : null,
      createdAt: b.createdAt,
      time: new Date(b.createdAt).toLocaleString('zh-CN'),
      summary: summarizeLines(b.lines),
    });
  }

  for (const b of store.canada28.bets || []) {
    if (String(b.userId) !== uid) continue;
    if (!inShanghaiDayRange(b.createdAt, f, t)) continue;
    out.push({
      id: b.id,
      game: 'ca28',
      gameLabel: 'PC28',
      period: b.period,
      amount: Number(b.total) || 0,
      status: b.status,
      payout: b.payout != null ? Number(b.payout) : null,
      createdAt: b.createdAt,
      time: new Date(b.createdAt).toLocaleString('zh-CN'),
      summary: summarizeLines(b.lines),
    });
  }

  for (const b of store.speedRacing.bets || []) {
    if (String(b.userId) !== uid) continue;
    if (!inShanghaiDayRange(b.createdAt, f, t)) continue;
    out.push({
      id: b.id,
      game: 'speed',
      gameLabel: '急速赛车',
      period: b.period,
      amount: Number(b.total) || 0,
      status: b.status,
      payout: b.payout != null ? Number(b.payout) : null,
      createdAt: b.createdAt,
      time: new Date(b.createdAt).toLocaleString('zh-CN'),
      summary: summarizeLines(b.lines),
    });
  }

  out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return out.slice(0, lim);
}

function userMatchesQuery(store, userId, qLower) {
  if (!qLower) return true;
  const u = (store.users || []).find((uu) => uu.id === userId);
  if (!u) return String(userId || '').toLowerCase().includes(qLower);
  const hay = [u.nickname, String(u.displayId8 || ''), String(u.customerNo || ''), u.id].join(' ').toLowerCase();
  return hay.includes(qLower);
}

/** 管理端：全站注单（日区间 + 用户关键词 + 游戏） */
function listAllBetOrdersAdmin(store, fromYmd, toYmd, limitRaw, qRaw, gameRaw) {
  const lim = Math.min(Math.max(Number(limitRaw) || 800, 1), 3000);
  const f = fromYmd || shanghaiTodayYmd();
  const t = toYmd || f;
  const q = String(qRaw || '').trim().toLowerCase();
  const game = String(gameRaw || '').trim().toLowerCase();
  const want = (key) => !game || game === 'all' || game === key;

  hkMarkSix.ensureHk6(store);
  canada28.ensureCanada28(store);
  speedRacing.ensureSpeed(store);

  const out = [];

  if (want('hk6')) {
    for (const b of store.hkMarkSix.bets || []) {
      if (!userMatchesQuery(store, b.userId, q)) continue;
      if (!inShanghaiDayRange(b.createdAt, f, t)) continue;
      out.push({
        id: b.id,
        game: 'hk6',
        gameLabel: '香港六合彩',
        userId: b.userId,
        period: b.period,
        amount: Number(b.total) || 0,
        status: b.status,
        payout: b.payout != null ? Number(b.payout) : null,
        createdAt: b.createdAt,
        time: new Date(b.createdAt).toLocaleString('zh-CN'),
        summary: summarizeLines(b.lines),
      });
    }
  }
  if (want('ca28')) {
    for (const b of store.canada28.bets || []) {
      if (!userMatchesQuery(store, b.userId, q)) continue;
      if (!inShanghaiDayRange(b.createdAt, f, t)) continue;
      out.push({
        id: b.id,
        game: 'ca28',
        gameLabel: 'PC28',
        userId: b.userId,
        period: b.period,
        amount: Number(b.total) || 0,
        status: b.status,
        payout: b.payout != null ? Number(b.payout) : null,
        createdAt: b.createdAt,
        time: new Date(b.createdAt).toLocaleString('zh-CN'),
        summary: summarizeLines(b.lines),
      });
    }
  }
  if (want('speed')) {
    for (const b of store.speedRacing.bets || []) {
      if (!userMatchesQuery(store, b.userId, q)) continue;
      if (!inShanghaiDayRange(b.createdAt, f, t)) continue;
      out.push({
        id: b.id,
        game: 'speed',
        gameLabel: '急速赛车',
        userId: b.userId,
        period: b.period,
        amount: Number(b.total) || 0,
        status: b.status,
        payout: b.payout != null ? Number(b.payout) : null,
        createdAt: b.createdAt,
        time: new Date(b.createdAt).toLocaleString('zh-CN'),
        summary: summarizeLines(b.lines),
      });
    }
  }

  for (const row of out) {
    const u = (store.users || []).find((uu) => uu.id === row.userId);
    row.nickname = u ? u.nickname : '—';
    row.displayId8 = u ? String(u.displayId8 || '') : '';
    row.customerNo = u ? String(u.customerNo || '') : '';
  }

  out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return out.slice(0, lim);
}

module.exports = {
  listBetOrders,
  listAllBetOrdersAdmin,
  shanghaiTodayYmd,
};
