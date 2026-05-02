/**
 * 管理端修改会员资料、余额、密码、密保、上下级等
 */
const crypto = require('crypto');
const finance = require('./finance');

function buildAdminUserDetail(store, user) {
  if (!user) return null;
  finance.ensureUserFinance(user, store);
  const sec = Array.isArray(user.security) ? user.security : [];
  const mine = (store.inviteCodes || []).find((ic) => ic.ownerUserId === user.id);
  const inviteCodeDisplay = mine ? String(mine.code || '') : '';
  return {
    id: user.id,
    nickname: user.nickname,
    displayId8: String(user.displayId8 || ''),
    customerNo: String(user.customerNo || ''),
    inviteCodeDisplay,
    balance: Number(Number(user.balance || 0).toFixed(2)),
    parentId: user.parentId || null,
    agentStatus: user.agentStatus === 'disabled' ? 'disabled' : 'active',
    createdAt: user.createdAt || null,
    lastIp: String(user.lastIp || ''),
    lastIpAt: user.lastIpAt || null,
    registeredViaInviteCode: user.registeredViaInviteCode || null,
    hasLoginPassword: Boolean(user.passwordHash),
    hasTradePassword: Boolean(user.tradePasswordHash),
    securityQuestions: sec.map((r) => ({ questionId: String(r.questionId || '') })),
  };
}

function patchAdminUser(user, body, ctx) {
  const store = ctx.store;
  const { hashPassword, saveStore, userById, findUserByNickname, codesForOwner, normInviteCode } = ctx;
  const reason = String(body.reason || '').trim();
  if (reason.length < 2) return { error: '操作原因至少 2 个字' };

  if (body.nickname !== undefined) {
    const nn = String(body.nickname || '').trim();
    if (nn.length < 2) return { error: '用户名至少 2 个字符' };
    const other = findUserByNickname(nn);
    if (other && other.id !== user.id) return { error: '该用户名已被占用' };
    user.nickname = nn;
  }

  if (body.parentId !== undefined) {
    const pid = String(body.parentId || '').trim();
    if (!pid) {
      user.parentId = null;
    } else {
      if (pid === user.id) return { error: '不能将自己设为上级' };
      const p = userById(pid);
      if (!p) return { error: '上级用户不存在' };
      user.parentId = pid;
    }
  }

  if (body.agentStatus !== undefined) {
    const s = String(body.agentStatus || '').trim();
    if (s === 'active' || s === 'disabled') user.agentStatus = s;
  }

  if (body.displayId8 !== undefined) {
    const d8 = String(body.displayId8 || '').trim();
    if (d8 && !/^\d{8}$/.test(d8)) return { error: '展示 ID 须为 8 位数字' };
    if (d8) {
      const clash = store.users.some((u) => u.id !== user.id && String(u.displayId8 || '') === d8);
      if (clash) return { error: '该展示 ID 已被占用' };
      user.displayId8 = d8;
    }
  }

  if (body.customerNo !== undefined) {
    const c = body.customerNo;
    if (c === null || c === '') {
      /* keep */
    } else {
      const n = Number(c);
      if (!Number.isFinite(n) || n < 1) return { error: '客户号须为正整数' };
      const clash = store.users.some((u) => u.id !== user.id && Number(u.customerNo) === n);
      if (clash) return { error: '该客户号已被占用' };
      user.customerNo = n;
      if (!store.meta || typeof store.meta !== 'object') store.meta = {};
      if (typeof store.meta.nextCustomerNo !== 'number') store.meta.nextCustomerNo = 100001;
      store.meta.nextCustomerNo = Math.max(store.meta.nextCustomerNo, n + 1);
    }
  }

  if (body.balanceSet !== undefined && body.balanceDelta !== undefined) {
    return { error: '请勿同时传 balanceSet 与 balanceDelta' };
  }

  if (body.balanceSet !== undefined) {
    const target = Number(body.balanceSet);
    if (!Number.isFinite(target) || target < 0) return { error: '余额须为不小于 0 的数字' };
    finance.ensureUserFinance(user, store);
    const prev = Number(user.balance) || 0;
    const next = Number(target.toFixed(2));
    const delta = next - prev;
    user.balance = next;
    if (Math.abs(delta) > 1e-6) {
      finance.appendLedgerEntry(store, user.id, {
        type: 'admin_set_balance',
        title: '后台设定余额',
        delta,
        balanceAfter: user.balance,
        status: '成功',
        meta: { reason, prev, next },
      });
    }
  } else if (body.balanceDelta !== undefined) {
    const d = Number(body.balanceDelta);
    if (!Number.isFinite(d) || d === 0) return { error: 'balanceDelta 须为非 0 数字' };
    finance.ensureUserFinance(user, store);
    const prev = Number(user.balance) || 0;
    const next = Number((prev + d).toFixed(2));
    if (next < 0) return { error: '调整后余额不能为负' };
    user.balance = next;
    finance.appendLedgerEntry(store, user.id, {
      type: 'admin_adjust',
      title: d >= 0 ? '后台上分' : '后台下分',
      delta: d,
      balanceAfter: user.balance,
      status: '成功',
      meta: { reason },
    });
  }

  if (body.newLoginPassword) {
    const a = String(body.newLoginPassword || '');
    const b = String(body.newLoginPasswordConfirm || '');
    if (a.length < 6) return { error: '新登录密码至少 6 位' };
    if (a !== b) return { error: '两次新登录密码不一致' };
    const hp = hashPassword(a);
    user.passwordHash = hp.hash;
    user.passwordSalt = hp.salt;
  }

  if (body.newTradePassword) {
    const tp = String(body.newTradePassword || '');
    if (!/^\d{6}$/.test(tp)) return { error: '交易密码须为 6 位数字' };
    const th = hashPassword(tp);
    user.tradePasswordHash = th.hash;
    user.tradePasswordSalt = th.salt;
  }

  if (body.security !== undefined) {
    const arr = Array.isArray(body.security) ? body.security : [];
    if (arr.length !== 2) return { error: '密保须为 2 条' };
    const ids = new Set();
    const out = [];
    for (const row of arr) {
      const qid = String(row.questionId || '').trim();
      const ans = String(row.answer || '').trim();
      if (!qid || !ans) return { error: '密保问题与答案均须填写' };
      if (ids.has(qid)) return { error: '两条密保问题不能相同' };
      ids.add(qid);
      out.push({ questionId: qid, answer: ans });
    }
    user.security = out;
  }

  if (body.inviteCodeDisplay !== undefined) {
    const code = String(body.inviteCodeDisplay || '').trim().toUpperCase();
    if (code) {
      const mine = codesForOwner(user.id)[0];
      const conflict = store.inviteCodes.find((ic) => normInviteCode(ic.code) === code && ic.id !== mine?.id);
      if (conflict) return { error: '该邀请码已被占用' };
      if (mine) {
        mine.code = code;
      } else {
        store.inviteCodes.push({
          id: `inv_${crypto.randomBytes(6).toString('hex')}`,
          code,
          ownerUserId: user.id,
          rates: {},
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  saveStore();
  return { ok: true };
}

module.exports = { buildAdminUserDetail, patchAdminUser };
