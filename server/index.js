/**
 * 参考星彩 xingcai-platform-new 的 /api/admin 契约；数据为大都汇：用户、邀请码、parentId。
 * 环境变量：ADMIN_TOKEN, ADMIN_USERNAME, ADMIN_PASSWORD, PORT
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const finance = require('./finance');
const hkMarkSix = require('./hkMarkSix');

const PORT = Number(process.env.PORT || 3301);
/** 星彩式：X-Admin-Token 或环境变量，与 /api/admin/login 独立 */
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'daduhui_admin';
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

/** @type {{ users: any[]; inviteCodes: any[]; cms?: { companyInfo?: Record<string, unknown> } }} */
let store = { users: [], inviteCodes: [], cms: { companyInfo: {} } };

/** @type {Map<string, string>} */
const sessions = new Map();

/** @type {Map<string, { userId: string; captchaAnswer: string }>} */
const preSessions = new Map();

/** 管理端登录后 Bearer，与玩家 session 独立 */
const adminSessions = new Map();

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const j = JSON.parse(raw);
    if (!Array.isArray(j.users)) j.users = [];
    if (!Array.isArray(j.inviteCodes)) j.inviteCodes = [];
    if (!j.cms || typeof j.cms !== 'object') j.cms = { companyInfo: {} };
    if (!j.cms.companyInfo || typeof j.cms.companyInfo !== 'object') j.cms.companyInfo = {};
    return j;
  } catch {
    /* empty */
  }
  return { users: [], inviteCodes: [], cms: { companyInfo: {} } };
}

function saveStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

store = loadStore();

function migrateStore() {
  finance.ensureMeta(store);
  for (const u of store.users) {
    finance.ensureUserFinance(u, store);
  }
  hkMarkSix.ensureHk6(store);
  saveStore();
}

migrateStore();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const h = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 2e6) {
        req.destroy();
        reject(new Error('payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function getBearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7).trim();
}

function authUserId(req) {
  const t = getBearer(req);
  if (!t) return null;
  return sessions.get(t) || null;
}

function findUserByNickname(nickname) {
  const n = String(nickname || '').trim();
  return store.users.find((u) => u.nickname === n) || null;
}

function normInviteCode(code) {
  return String(code || '').trim().toUpperCase();
}

function findInviteByCode(code) {
  const n = normInviteCode(code);
  if (!n) return null;
  return store.inviteCodes.find((ic) => normInviteCode(ic.code) === n) || null;
}

function securityPresets() {
  return {
    success: true,
    list: [
      { id: 'q1', text: '你的小学名字是什么？' },
      { id: 'q2', text: '你最喜欢的颜色是什么？' },
      { id: 'q3', text: '你的出生地是哪里？' },
      { id: 'q4', text: '你最好的朋友名字是什么？' },
    ],
    rows: [],
  };
}

function setCaptcha(preSessionId) {
  const a = 1 + Math.floor(Math.random() * 12);
  const b = 1 + Math.floor(Math.random() * 12);
  const entry = preSessions.get(preSessionId);
  if (entry) {
    entry.captchaAnswer = String(a + b);
  }
  return {
    success: true,
    captchaId: 'math',
    prompt: `${a} + ${b} = ？`,
  };
}

function genInviteCodeString() {
  return `DH${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function userById(id) {
  return store.users.find((u) => u.id === id) || null;
}

function buildRelationOverview() {
  const byParent = new Map();
  for (const u of store.users) {
    const pid = u.parentId;
    if (!pid) continue;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push({ id: u.id, nickname: u.nickname, createdAt: u.createdAt });
  }

  return store.users.map((u) => {
    const parent = u.parentId ? userById(u.parentId) : null;
    const children = byParent.get(u.id) || [];
    return {
      id: u.id,
      nickname: u.nickname,
      parentId: u.parentId || null,
      parentNickname: parent ? parent.nickname : null,
      registeredViaInviteCode: u.registeredViaInviteCode || null,
      createdAt: u.createdAt,
      directDownlineCount: children.length,
      directDownline: children,
    };
  });
}

function codesForOwner(uid) {
  return store.inviteCodes.filter((ic) => ic.ownerUserId === uid).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function listAgentsForDaduhui({ q = '', status = '' } = {}) {
  let rows = store.users.map((u) => {
    const codes = codesForOwner(u.id);
    const latest = codes[0];
    const teamSize = store.users.filter((x) => x.parentId === u.id).length;
    const st = u.agentStatus === 'disabled' ? 'disabled' : 'active';
    return {
      id: u.id,
      nickname: u.nickname,
      loginName: u.nickname,
      phone: '',
      realName: '',
      createdAt: u.createdAt,
      agentCode: latest ? latest.code : '',
      parentAgentId: u.parentId || '',
      status: st,
      teamSize,
      teamVolume: 0,
      account: { available: 0, totalAsset: 0 },
    };
  });
  const qv = String(q || '').trim().toLowerCase();
  if (qv) {
    rows = rows.filter((x) =>
      [x.id, x.nickname, x.loginName, x.phone, x.realName, x.agentCode, x.parentAgentId]
        .map((s) => String(s || '').toLowerCase())
        .some((s) => s.includes(qv)),
    );
  }
  const st = String(status || '').trim();
  if (st === 'active' || st === 'disabled') rows = rows.filter((x) => x.status === st);
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return rows;
}

function getAgentDetailForDaduhui(agentId) {
  const row = listAgentsForDaduhui({}).find((x) => x.id === agentId);
  if (!row) return null;
  const u = userById(agentId);
  const uplines = [];
  if (u) {
    let cur = u;
    const seen = new Set();
    while (cur.parentId && !seen.has(cur.id)) {
      seen.add(cur.id);
      const par = userById(cur.parentId);
      if (!par) break;
      uplines.unshift({ id: par.id, nickname: par.nickname });
      cur = par;
    }
  }
  const inviteCodes = codesForOwner(agentId).map((ic) => ({
    id: ic.id,
    code: ic.code,
    createdAt: ic.createdAt,
    rates: ic.rates || {},
  }));
  const directDownlines = store.users
    .filter((x) => x.parentId === agentId)
    .map((x) => ({ id: x.id, nickname: x.nickname, createdAt: x.createdAt }));
  return {
    ...row,
    uplines,
    inviteCodes,
    directDownlines,
    registeredViaInviteCode: u?.registeredViaInviteCode || '',
  };
}

function getAdminBearer(req) {
  const b = getBearer(req);
  if (b && adminSessions.has(b)) return b;
  return null;
}

function authAdminRequest(req) {
  return Boolean(getAdminBearer(req) || (req.headers['x-admin-token'] && req.headers['x-admin-token'] === ADMIN_TOKEN));
}

function requireAdmin(req, res) {
  if (!authAdminRequest(req)) {
    json(res, 401, { success: false, message: '需要管理员登录或有效密钥' });
    return false;
  }
  return true;
}

const WEB_DIST = path.join(__dirname, '..', 'dist');

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function safeFileUnderDir(baseDir, relFile) {
  const full = path.resolve(path.join(baseDir, relFile));
  const base = path.resolve(baseDir);
  const rel = path.relative(base, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
}

function tryServeWebpackDist(req, res, pathname) {
  if ((req.method !== 'GET' && req.method !== 'HEAD') || pathname.startsWith('/api')) return false;
  if (process.env.SERVE_STATIC === '0') return false;
  if (!fs.existsSync(WEB_DIST)) return false;

  const clean = pathname.split('?')[0] || '/';
  const relFile = clean === '/' ? 'index.html' : clean.replace(/^\//, '');

  const direct = safeFileUnderDir(WEB_DIST, relFile);
  if (direct && fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    const ext = path.extname(direct).toLowerCase();
    const mime = STATIC_MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    fs.createReadStream(direct).pipe(res);
    return true;
  }

  const indexHtml = path.join(WEB_DIST, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    fs.createReadStream(indexHtml).pipe(res);
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const p = url.pathname;

  try {
    /** ----- GET /api/auth/security-question-presets ----- */
    if (req.method === 'GET' && p === '/api/auth/security-question-presets') {
      json(res, 200, securityPresets());
      return;
    }

    /** ----- POST /api/auth/register ----- */
    if (req.method === 'POST' && p === '/api/auth/register') {
      const body = await parseBody(req);
      const nickname = String(body.nickname || '').trim();
      const password = String(body.password || '');
      const passwordConfirm = String(body.passwordConfirm || '');
      const tradePassword = String(body.tradePassword || '');
      const inviteRaw = body.inviteCode != null ? String(body.inviteCode) : '';
      const inviteCodeNorm = normInviteCode(inviteRaw);

      if (nickname.length < 2) {
        json(res, 200, { success: false, message: '用户名至少 2 个字符' });
        return;
      }
      if (password.length < 6) {
        json(res, 200, { success: false, message: '登录密码至少 6 位' });
        return;
      }
      if (password !== passwordConfirm) {
        json(res, 200, { success: false, message: '两次输入的登录密码不一致' });
        return;
      }
      if (!/^\d{6}$/.test(tradePassword)) {
        json(res, 200, { success: false, message: '交易密码须为 6 位数字' });
        return;
      }
      if (findUserByNickname(nickname)) {
        json(res, 200, { success: false, message: '该用户名已被注册' });
        return;
      }

      let parentId = null;
      let registeredViaInviteCode = null;
      if (inviteCodeNorm) {
        const ic = findInviteByCode(inviteCodeNorm);
        if (!ic) {
          json(res, 200, { success: false, message: '邀请码无效或已失效' });
          return;
        }
        parentId = ic.ownerUserId;
        registeredViaInviteCode = ic.code;
        if (parentId && userById(parentId)?.nickname === nickname) {
          json(res, 200, { success: false, message: '不能使用自己的邀请码注册' });
          return;
        }
      }

      const { hash, salt } = hashPassword(password);
      const tradeHash = hashPassword(tradePassword);
      const id = `u_${crypto.randomBytes(8).toString('hex')}`;
      const user = {
        id,
        nickname,
        passwordHash: hash,
        passwordSalt: salt,
        tradePasswordHash: tradeHash.hash,
        tradePasswordSalt: tradeHash.salt,
        security: Array.isArray(body.security) ? body.security : [],
        parentId,
        registeredViaInviteCode,
        createdAt: new Date().toISOString(),
        agentStatus: 'active',
      };
      store.users.push(user);
      finance.ensureUserFinance(user, store);
      saveStore();

      const token = randomToken();
      sessions.set(token, id);
      json(res, 200, {
        success: true,
        message: '注册成功',
        token,
      });
      return;
    }

    /** ----- POST /api/auth/login ----- */
    if (req.method === 'POST' && p === '/api/auth/login') {
      const body = await parseBody(req);
      const nickname = String(body.nickname || '').trim();
      const password = String(body.password || '');
      const user = findUserByNickname(nickname);
      if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        json(res, 200, { success: false, message: '账号或密码错误' });
        return;
      }
      const preSessionId = crypto.randomBytes(16).toString('hex');
      const a = 1 + Math.floor(Math.random() * 12);
      const b = 1 + Math.floor(Math.random() * 12);
      preSessions.set(preSessionId, {
        userId: user.id,
        captchaAnswer: String(a + b),
      });
      json(res, 200, {
        success: true,
        needHumanVerify: true,
        preSessionId,
        captchaId: 'math',
        prompt: `${a} + ${b} = ？`,
      });
      return;
    }

    /** ----- POST /api/auth/login-refresh-human ----- */
    if (req.method === 'POST' && p === '/api/auth/login-refresh-human') {
      const body = await parseBody(req);
      const preSessionId = String(body.preSessionId || '');
      if (!preSessions.has(preSessionId)) {
        json(res, 200, { success: false, message: '会话已失效，请重新登录' });
        return;
      }
      const captcha = setCaptcha(preSessionId);
      json(res, 200, captcha);
      return;
    }

    /** ----- POST /api/auth/login-confirm ----- */
    if (req.method === 'POST' && p === '/api/auth/login-confirm') {
      const body = await parseBody(req);
      const preSessionId = String(body.preSessionId || '');
      const captchaAnswer = String(body.captchaAnswer || '').trim();
      const entry = preSessions.get(preSessionId);
      if (!entry) {
        json(res, 200, { success: false, message: '会话已失效，请重新登录' });
        return;
      }
      if (captchaAnswer !== entry.captchaAnswer) {
        const a = 1 + Math.floor(Math.random() * 12);
        const b = 1 + Math.floor(Math.random() * 12);
        entry.captchaAnswer = String(a + b);
        json(res, 200, {
          success: false,
          message: '验证答案不正确',
          captchaId: 'math',
          prompt: `${a} + ${b} = ？`,
        });
        return;
      }
      preSessions.delete(preSessionId);
      const token = randomToken();
      sessions.set(token, entry.userId);
      json(res, 200, { success: true, token });
      return;
    }

    /** ----- GET /api/me/summary ----- */
    if (req.method === 'GET' && p === '/api/me/summary') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const user = userById(uid);
      if (!user) {
        json(res, 401, { success: false, message: '用户不存在' });
        return;
      }
      finance.ensureUserFinance(user, store);
      saveStore();
      const base = finance.buildMeSummary(user, store);
      const hkRoom = hkMarkSix.getUserRoomStats(store, uid);
      base.data.hk6Turnover = hkRoom.turnover;
      base.data.hk6Pnl = hkRoom.pnl;
      base.data.hk6Rebate = hkRoom.rebate;
      json(res, 200, base);
      return;
    }

    /** ----- GET /api/me/wallet-records ----- */
    if (req.method === 'GET' && p === '/api/me/wallet-records') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const q = new URL(req.url || '', 'http://x');
      const limit = Number(q.searchParams.get('limit'));
      json(res, 200, { success: true, list: finance.listWalletRecords(store, uid, { limit }) });
      return;
    }

    /** ----- POST /api/deposit/submit ----- */
    if (req.method === 'POST' && p === '/api/deposit/submit') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const user = userById(uid);
      if (!user) {
        json(res, 401, { success: false, message: '用户不存在' });
        return;
      }
      const body = await parseBody(req);
      const amount = Number(body.amount);
      const payMethod = String(body.payMethod || 'unknown');
      if (!Number.isFinite(amount) || amount <= 0) {
        json(res, 200, { success: false, message: '请输入有效充值金额' });
        return;
      }
      finance.ensureUserFinance(user, store);
      user.balance = Number((user.balance + amount).toFixed(2));
      finance.appendLedgerEntry(store, uid, {
        type: 'deposit',
        title: '在线充值',
        delta: amount,
        balanceAfter: user.balance,
        status: '成功',
        meta: { payMethod },
      });
      saveStore();
      json(res, 200, { success: true, message: '到账成功（演示环境即时入账）', balance: user.balance });
      return;
    }

    /** ----- POST /api/withdraw/request ----- */
    if (req.method === 'POST' && p === '/api/withdraw/request') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const user = userById(uid);
      if (!user) {
        json(res, 401, { success: false, message: '用户不存在' });
        return;
      }
      if (!user.tradePasswordHash || !user.tradePasswordSalt) {
        json(res, 200, { success: false, message: '账户缺少交易密码，请联系客服或使用新账号' });
        return;
      }
      const body = await parseBody(req);
      const amount = Number(body.amount);
      const tradePassword = String(body.tradePassword || '');
      const withdrawMethod = String(body.withdrawMethod || '');
      const withdrawMethodDetail = String(body.withdrawMethodDetail || '');
      if (!Number.isFinite(amount) || amount < 100) {
        json(res, 200, { success: false, message: '单笔提现金额须不少于 100 元' });
        return;
      }
      if (!verifyPassword(tradePassword, user.tradePasswordHash, user.tradePasswordSalt)) {
        json(res, 200, { success: false, message: '交易密码错误' });
        return;
      }
      finance.ensureUserFinance(user, store);
      if (user.balance < amount) {
        json(res, 200, { success: false, message: '余额不足' });
        return;
      }
      user.balance = Number((user.balance - amount).toFixed(2));
      finance.appendLedgerEntry(store, uid, {
        type: 'withdraw',
        title: '提现申请',
        delta: -amount,
        balanceAfter: user.balance,
        status: '处理中',
        meta: { withdrawMethod, withdrawMethodDetail: withdrawMethodDetail.slice(0, 200) },
      });
      saveStore();
      json(res, 200, { success: true, message: '提现申请已提交' });
      return;
    }

    /** ----- GET /api/game/hk-marksix/status ----- */
    if (req.method === 'GET' && p === '/api/game/hk-marksix/status') {
      await hkMarkSix.touchHk6Sync(store, saveStore);
      hkMarkSix.flushPendingSettlements(store, saveStore);
      saveStore();
      json(res, 200, hkMarkSix.getStatus(store));
      return;
    }

    /** ----- GET /api/game/hk-marksix/history ----- */
    if (req.method === 'GET' && p === '/api/game/hk-marksix/history') {
      await hkMarkSix.touchHk6Sync(store, saveStore);
      hkMarkSix.flushPendingSettlements(store, saveStore);
      saveStore();
      const q = new URL(req.url || '', 'http://x');
      const limit = q.searchParams.get('limit');
      json(res, 200, hkMarkSix.getHistory(store, limit));
      return;
    }

    /** ----- POST /api/game/hk-marksix/bet ----- */
    if (req.method === 'POST' && p === '/api/game/hk-marksix/bet') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const user = userById(uid);
      if (!user) {
        json(res, 401, { success: false, message: '用户不存在' });
        return;
      }
      const body = await parseBody(req);
      finance.ensureUserFinance(user, store);
      const ledgerAppend = (userId, entry) => finance.appendLedgerEntry(store, userId, entry);
      const result = await hkMarkSix.placeBet(store, uid, body, ledgerAppend, saveStore, user);
      if (!result.ok) {
        json(res, result.status, result.body);
        return;
      }
      json(res, 200, result.body);
      return;
    }

    /** ----- GET /api/agent/invite-codes ----- */
    if (req.method === 'GET' && p === '/api/agent/invite-codes') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const list = store.inviteCodes
        .filter((ic) => ic.ownerUserId === uid)
        .map((ic) => ({
          id: ic.id,
          code: ic.code,
          createdAt: ic.createdAt,
          rates: ic.rates || {},
        }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      json(res, 200, { success: true, list });
      return;
    }

    /** ----- POST /api/agent/invite-codes ----- */
    if (req.method === 'POST' && p === '/api/agent/invite-codes') {
      const uid = authUserId(req);
      if (!uid) {
        json(res, 401, { success: false, message: '请先登录' });
        return;
      }
      const body = await parseBody(req);
      const rates = body.rates && typeof body.rates === 'object' ? body.rates : {};
      const AGENT_MAX_INVITE_CODES = 10;
      const existing = store.inviteCodes.filter((ic) => ic.ownerUserId === uid).length;
      if (existing >= AGENT_MAX_INVITE_CODES) {
        json(res, 200, { success: false, message: `每位代理最多保留 ${AGENT_MAX_INVITE_CODES} 个邀请码` });
        return;
      }
      let code = genInviteCodeString();
      let tries = 0;
      while (findInviteByCode(code) && tries < 20) {
        code = genInviteCodeString();
        tries += 1;
      }
      const row = {
        id: `inv_${crypto.randomBytes(6).toString('hex')}`,
        code,
        ownerUserId: uid,
        rates,
        createdAt: new Date().toISOString(),
      };
      store.inviteCodes.push(row);
      saveStore();
      json(res, 200, {
        success: true,
        invite: {
          id: row.id,
          code: row.code,
          createdAt: row.createdAt,
          rates: row.rates,
        },
      });
      return;
    }

    /** ----- POST /api/admin/login（星彩对齐） ----- */
    if (req.method === 'POST' && p === '/api/admin/login') {
      const body = await parseBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        json(res, 401, { success: false, message: '账号或密码错误' });
        return;
      }
      const token = randomToken();
      adminSessions.set(token, 'admin');
      json(res, 200, { success: true, token });
      return;
    }

    /** ----- GET /api/admin/dashboard ----- */
    if (req.method === 'GET' && p === '/api/admin/dashboard') {
      if (!requireAdmin(req, res)) return;
      const usersTotal = store.users.length;
      json(res, 200, {
        success: true,
        data: {
          usersTotal,
          onlineNow: 0,
          activeOrders: 0,
          depositsToday: 0,
          withdrawalsToday: 0,
          ordersSettledToday: 0,
          userCount: usersTotal,
        },
      });
      return;
    }

    /** ----- GET /api/admin/cms ----- */
    if (req.method === 'GET' && p === '/api/admin/cms') {
      if (!requireAdmin(req, res)) return;
      json(res, 200, {
        success: true,
        data: {
          companyInfo: store.cms.companyInfo || {},
        },
      });
      return;
    }

    /** ----- PUT /api/admin/cms/companyInfo ----- */
    if (req.method === 'PUT' && p === '/api/admin/cms/companyInfo') {
      if (!requireAdmin(req, res)) return;
      const body = await parseBody(req);
      const data = body.data && typeof body.data === 'object' ? body.data : {};
      store.cms.companyInfo = { ...(store.cms.companyInfo || {}), ...data };
      saveStore();
      json(res, 200, { success: true });
      return;
    }

    /** ----- GET /api/admin/users（会员列表 / 上下级） ----- */
    if (req.method === 'GET' && p === '/api/admin/users') {
      if (!requireAdmin(req, res)) return;
      json(res, 200, { success: true, list: buildRelationOverview() });
      return;
    }

    /** ----- GET /api/admin/agents ----- */
    if (req.method === 'GET' && p === '/api/admin/agents') {
      if (!requireAdmin(req, res)) return;
      const q = url.searchParams.get('q') || '';
      const status = url.searchParams.get('status') || '';
      json(res, 200, { success: true, list: listAgentsForDaduhui({ q, status }) });
      return;
    }

    /** ----- GET /api/admin/agents/:id/detail ----- */
    {
      const m = p.match(/^\/api\/admin\/agents\/([^/]+)\/detail$/);
      if (req.method === 'GET' && m) {
        if (!requireAdmin(req, res)) return;
        const id = decodeURIComponent(m[1]);
        const row = getAgentDetailForDaduhui(id);
        if (!row) {
          json(res, 404, { success: false, message: '用户不存在' });
          return;
        }
        json(res, 200, { success: true, data: row });
        return;
      }
    }

    /** ----- PATCH /api/admin/agents/:id ----- */
    {
      const m = p.match(/^\/api\/admin\/agents\/([^/]+)$/);
      if (req.method === 'PATCH' && m) {
        if (!requireAdmin(req, res)) return;
        const id = decodeURIComponent(m[1]);
        const u = userById(id);
        if (!u) {
          json(res, 404, { success: false, message: '用户不存在' });
          return;
        }
        const body = await parseBody(req);
        const reason = String(body.reason || '').trim();
        if (reason.length < 2) {
          json(res, 400, { success: false, message: '操作原因至少 2 个字' });
          return;
        }
        if (body.parentAgentId !== undefined) {
          const pid = String(body.parentAgentId || '').trim();
          if (pid && !userById(pid)) {
            json(res, 400, { success: false, message: '上级用户不存在' });
            return;
          }
          if (pid === id) {
            json(res, 400, { success: false, message: '不能将自己设为上级' });
            return;
          }
          u.parentId = pid || null;
        }
        if (body.agentCode !== undefined) {
          const code = String(body.agentCode || '').trim().toUpperCase();
          if (code) {
            const mine = codesForOwner(id)[0];
            const conflict = store.inviteCodes.find(
              (ic) => normInviteCode(ic.code) === code && ic.id !== mine?.id,
            );
            if (conflict) {
              json(res, 400, { success: false, message: '该代理码已被占用' });
              return;
            }
            if (mine) {
              mine.code = code;
            } else {
              store.inviteCodes.push({
                id: `inv_${crypto.randomBytes(6).toString('hex')}`,
                code,
                ownerUserId: id,
                rates: {},
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
        if (body.status !== undefined) {
          const s = String(body.status || '').trim();
          if (s === 'active' || s === 'disabled') u.agentStatus = s;
        }
        saveStore();
        json(res, 200, { success: true, data: getAgentDetailForDaduhui(id) });
        return;
      }
    }

    /** ----- GET /api/admin/user-relations ----- */
    if (req.method === 'GET' && p === '/api/admin/user-relations') {
      if (!requireAdmin(req, res)) return;
      const q = url.searchParams.get('nickname');
      let overview = buildRelationOverview();
      if (q && String(q).trim()) {
        const needle = String(q).trim();
        overview = overview.filter((u) => u.nickname.includes(needle));
      }
      json(res, 200, { success: true, users: overview });
      return;
    }

    /** ----- GET /api/admin/user-tree/:nickname ----- */
    if (req.method === 'GET' && p.startsWith('/api/admin/user-tree/')) {
      if (!requireAdmin(req, res)) return;
      const nickname = decodeURIComponent(p.slice('/api/admin/user-tree/'.length));
      const user = findUserByNickname(nickname);
      if (!user) {
        json(res, 404, { success: false, message: '用户不存在' });
        return;
      }
      const uplines = [];
      let cur = user;
      const seen = new Set();
      while (cur.parentId && !seen.has(cur.id)) {
        seen.add(cur.id);
        const par = userById(cur.parentId);
        if (!par) break;
        uplines.unshift({ id: par.id, nickname: par.nickname });
        cur = par;
      }
      const downlines = store.users
        .filter((u) => u.parentId === user.id)
        .map((u) => ({ id: u.id, nickname: u.nickname, createdAt: u.createdAt }));
      json(res, 200, {
        success: true,
        user: { id: user.id, nickname: user.nickname, parentId: user.parentId, registeredViaInviteCode: user.registeredViaInviteCode },
        uplines,
        directDownlines: downlines,
      });
      return;
    }

    if (tryServeWebpackDist(req, res, p)) {
      return;
    }

    json(res, 404, { success: false, message: 'Not found' });
  } catch (err) {
    console.error(err);
    json(res, 500, { success: false, message: err instanceof Error ? err.message : '服务器错误' });
  }
});

server.listen(PORT, () => {
  const hasDist = fs.existsSync(WEB_DIST);
  if (hasDist) {
    console.log(`已启动 http://localhost:${PORT} — 网页和接口是同一个地址，用浏览器打开即可。`);
  } else {
    console.log(`接口已启动 http://localhost:${PORT}（若无网页请先在本目录执行：npm run build）`);
  }
});
