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

function randomDisplayId8() {
  return String(crypto.randomInt(10000000, 100000000));
}

/** 与 `src/lib/publicDisplayId8.ts` 相同：由内部 id 稳定派生 8 位数（外观随机、同账号不变） */
function derivedDisplayId8FromSeed(seed) {
  const s = String(seed || '0');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  return String(10000000 + (u % 90000000));
}

/** 8 位对外展示 ID（充值留言、页头）：持久化在 user.displayId8，全库唯一 */
function ensureUserDisplayId8(user, store) {
  const cur = String(user.displayId8 || '').trim();
  if (/^\d{8}$/.test(cur)) return;
  const used = new Set();
  for (const u of store.users || []) {
    const s = String(u.displayId8 || '').trim();
    if (/^\d{8}$/.test(s)) used.add(s);
  }
  const derived = derivedDisplayId8FromSeed(user.id);
  if (!used.has(derived)) {
    user.displayId8 = derived;
    return;
  }
  let id = randomDisplayId8();
  for (let i = 0; i < 5000; i++) {
    if (!used.has(id)) {
      user.displayId8 = id;
      return;
    }
    id = randomDisplayId8();
  }
  user.displayId8 = id;
}

function ensureUserFinance(user, store) {
  ensureMeta(store);
  if (typeof user.balance !== 'number' || !Number.isFinite(user.balance)) user.balance = 0;
  if (user.customerNo == null || user.customerNo === '') {
    user.customerNo = store.meta.nextCustomerNo++;
  }
  ensureUserDisplayId8(user, store);
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
      displayId8: String(user.displayId8 || ''),
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

function shanghaiTodayYmd() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).slice(0, 10);
}

function listWalletRecords(store, userId, opts = {}) {
  ensureMeta(store);
  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 2000);
  const types =
    Array.isArray(opts.types) && opts.types.length
      ? opts.types.map((x) => String(x || '').trim()).filter(Boolean)
      : null;
  const fromYmd = String(opts.fromYmd || '').trim();
  const toYmd = String(opts.toYmd || '').trim();
  const applyRange = /^\d{4}-\d{2}-\d{2}$/.test(fromYmd) || /^\d{4}-\d{2}-\d{2}$/.test(toYmd);

  let rows = (store.ledger || []).filter((x) => x.userId === userId);
  if (types && types.length) {
    rows = rows.filter((x) => types.includes(String(x.type || '')));
  }
  if (applyRange) {
    const fUse = /^\d{4}-\d{2}-\d{2}$/.test(fromYmd) ? fromYmd : /^\d{4}-\d{2}-\d{2}$/.test(toYmd) ? toYmd : shanghaiTodayYmd();
    let tUse = /^\d{4}-\d{2}-\d{2}$/.test(toYmd) ? toYmd : fUse;
    if (tUse < fUse) tUse = fUse;
    const rangeStart = Date.parse(`${fUse}T00:00:00+08:00`);
    const rangeEnd = Date.parse(`${tUse}T23:59:59.999+08:00`);
    if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)) {
      rows = rows.filter((x) => {
        const ts = new Date(x.createdAt).getTime();
        return ts >= rangeStart && ts <= rangeEnd;
      });
    }
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    rows = rows.slice(0, limit);
  } else {
    rows = rows.slice(-limit).reverse();
  }
  return rows.map((r) => ({
    id: r.id,
    time: new Date(r.createdAt).toLocaleString('zh-CN'),
    type: r.title || r.type,
    amount: `${r.delta >= 0 ? '+' : ''}${Number(r.delta).toFixed(2)}`,
    status: r.status,
    ledgerType: String(r.type || ''),
  }));
}

/** 管理端：全站资金流水（可按日、类型、用户关键词筛） */
function listAllLedgerAdmin(store, opts = {}) {
  ensureMeta(store);
  const limit = Math.min(Math.max(Number(opts.limit) || 500, 1), 3000);
  let rows = [...(store.ledger || [])];
  const types =
    Array.isArray(opts.types) && opts.types.length
      ? opts.types.map((x) => String(x || '').trim()).filter(Boolean)
      : null;
  if (types && types.length) {
    rows = rows.filter((x) => types.includes(String(x.type || '')));
  }
  const fromYmd = String(opts.fromYmd || '').trim();
  const toYmd = String(opts.toYmd || '').trim();
  const applyRange = /^\d{4}-\d{2}-\d{2}$/.test(fromYmd) || /^\d{4}-\d{2}-\d{2}$/.test(toYmd);
  if (applyRange) {
    const fUse = /^\d{4}-\d{2}-\d{2}$/.test(fromYmd) ? fromYmd : /^\d{4}-\d{2}-\d{2}$/.test(toYmd) ? toYmd : shanghaiTodayYmd();
    let tUse = /^\d{4}-\d{2}-\d{2}$/.test(toYmd) ? toYmd : fUse;
    if (tUse < fUse) tUse = fUse;
    const rangeStart = Date.parse(`${fUse}T00:00:00+08:00`);
    const rangeEnd = Date.parse(`${tUse}T23:59:59.999+08:00`);
    if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)) {
      rows = rows.filter((x) => {
        const ts = new Date(x.createdAt).getTime();
        return ts >= rangeStart && ts <= rangeEnd;
      });
    }
  }
  const q = String(opts.q || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter((x) => {
      const u = (store.users || []).find((uu) => uu.id === x.userId);
      if (!u) return String(x.userId || '').toLowerCase().includes(q);
      ensureUserFinance(u, store);
      const hay = [u.nickname, String(u.displayId8 || ''), String(u.customerNo || ''), u.id].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  rows = rows.slice(0, limit);
  return rows.map((r) => {
    const u = (store.users || []).find((uu) => uu.id === r.userId);
    const nick = u ? u.nickname : '—';
    if (u) ensureUserFinance(u, store);
    return {
      id: r.id,
      userId: r.userId,
      nickname: nick,
      displayId8: u ? String(u.displayId8 || '') : '',
      customerNo: u ? String(u.customerNo || '') : '',
      time: new Date(r.createdAt).toLocaleString('zh-CN'),
      type: r.title || r.type,
      amount: `${r.delta >= 0 ? '+' : ''}${Number(r.delta).toFixed(2)}`,
      status: r.status,
      ledgerType: String(r.type || ''),
    };
  });
}

/** 管理端：处理「处理中」的提现流水（成功入账确认 / 驳回并退回余额） */
function patchWithdrawLedgerAdmin(store, txId, newStatus, reason) {
  ensureMeta(store);
  const row = (store.ledger || []).find((x) => x.id === txId);
  if (!row) return { error: '流水不存在' };
  if (String(row.type) !== 'withdraw') return { error: '仅支持提现类流水' };
  if (String(row.status) !== '处理中') return { error: '仅可处理状态为「处理中」的提现' };
  const user = (store.users || []).find((u) => u.id === row.userId);
  if (!user) return { error: '用户不存在' };
  const rs = String(newStatus || '').trim();
  const metaBase = row.meta && typeof row.meta === 'object' ? row.meta : {};
  if (rs === '成功' || rs === '已完成') {
    row.status = '成功';
    row.meta = { ...metaBase, adminApprove: true, reason: String(reason || '').slice(0, 500) };
    return { ok: true };
  }
  if (rs === '已驳回') {
    const amt = Math.abs(Number(row.delta));
    ensureUserFinance(user, store);
    user.balance = Number((Number(user.balance) + amt).toFixed(2));
    appendLedgerEntry(store, user.id, {
      type: 'withdraw_refund',
      title: '提现驳回退回',
      delta: amt,
      balanceAfter: user.balance,
      status: '成功',
      meta: { reason: String(reason || '').slice(0, 500), originalTx: txId },
    });
    row.status = '已驳回';
    row.meta = { ...metaBase, adminReject: true, reason: String(reason || '').slice(0, 500) };
    return { ok: true };
  }
  return { error: '目标状态须为「成功」或「已驳回」' };
}

/** 在已认证请求上按间隔累计在线时长（单次最多记 300s，避免异常跳变） */
function touchUserOnlineAccumulation(user) {
  if (!user || typeof user !== 'object') return;
  const now = Date.now();
  const prevIso = user._onlineTickAt;
  const prev = prevIso ? Date.parse(prevIso) : NaN;
  if (!Number.isFinite(prev)) {
    user._onlineTickAt = new Date().toISOString();
    return;
  }
  const elapsed = Math.floor((now - prev) / 1000);
  if (elapsed < 2) return;
  const add = Math.min(elapsed, 300);
  user.onlineSecondsTotal = Math.floor(Number(user.onlineSecondsTotal) || 0) + add;
  user._onlineTickAt = new Date().toISOString();
}

module.exports = {
  ensureMeta,
  ensureUserFinance,
  buildMeSummary,
  appendLedgerEntry,
  listWalletRecords,
  listAllLedgerAdmin,
  patchWithdrawLedgerAdmin,
  shanghaiTodayYmd,
  touchUserOnlineAccumulation,
};
