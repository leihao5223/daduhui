/**
 * 在线客服：会话 + 消息（持久化 store.supportSessions）
 */
const crypto = require('crypto');

const MAX_MSG = 400;
const MAX_SESSIONS = 2000;

function ensureSupport(store) {
  if (!Array.isArray(store.supportSessions)) store.supportSessions = [];
}

function trimSessions(store) {
  ensureSupport(store);
  if (store.supportSessions.length > MAX_SESSIONS) {
    store.supportSessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    store.supportSessions = store.supportSessions.slice(0, MAX_SESSIONS);
  }
}

function findSessionByUser(store, userId) {
  ensureSupport(store);
  return store.supportSessions.find((s) => s.userId === userId && s.status !== 'closed') || null;
}

function findSessionById(store, id) {
  ensureSupport(store);
  return store.supportSessions.find((s) => s.id === id) || null;
}

function getOrCreateSession(store, userId, nickname) {
  ensureSupport(store);
  let s = findSessionByUser(store, userId);
  if (s) {
    s.updatedAt = new Date().toISOString();
    return s;
  }
  const id = `ss_${crypto.randomBytes(8).toString('hex')}`;
  s = {
    id,
    userId,
    userNickname: String(nickname || '').slice(0, 64),
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminUnread: 0,
    userUnread: 0,
    messages: [
      {
        id: `m_${crypto.randomBytes(6).toString('hex')}`,
        role: 'system',
        text: '欢迎使用大都汇在线客服，请描述您的问题，工作人员将尽快回复。',
        createdAt: new Date().toISOString(),
      },
    ],
  };
  store.supportSessions.unshift(s);
  trimSessions(store);
  return s;
}

function appendMessage(store, session, role, text) {
  const t = String(text || '').trim().slice(0, 2000);
  if (!t) return null;
  const msg = {
    id: `m_${crypto.randomBytes(8).toString('hex')}`,
    role: role === 'admin' ? 'admin' : 'user',
    text: t,
    createdAt: new Date().toISOString(),
  };
  if (!Array.isArray(session.messages)) session.messages = [];
  session.messages.push(msg);
  if (session.messages.length > MAX_MSG) {
    session.messages = session.messages.slice(-MAX_MSG);
  }
  session.updatedAt = new Date().toISOString();
  if (msg.role === 'user') {
    session.adminUnread = (Number(session.adminUnread) || 0) + 1;
  } else {
    session.userUnread = (Number(session.userUnread) || 0) + 1;
  }
  return msg;
}

function listSessionsForAdmin(store) {
  ensureSupport(store);
  const rows = [...store.supportSessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return rows.map((s) => {
    const last = Array.isArray(s.messages) && s.messages.length ? s.messages[s.messages.length - 1] : null;
    return {
      id: s.id,
      userId: s.userId,
      userNickname: s.userNickname,
      status: s.status,
      updatedAt: s.updatedAt,
      adminUnread: Number(s.adminUnread) || 0,
      lastPreview: last ? String(last.text).slice(0, 80) : '',
      lastRole: last ? last.role : '',
    };
  });
}

function markAdminRead(store, sessionId) {
  const s = findSessionById(store, sessionId);
  if (!s) return false;
  s.adminUnread = 0;
  s.updatedAt = new Date().toISOString();
  return true;
}

function markUserRead(store, sessionId) {
  const s = findSessionById(store, sessionId);
  if (!s) return false;
  s.userUnread = 0;
  s.updatedAt = new Date().toISOString();
  return true;
}

function setSessionStatus(store, sessionId, status) {
  const s = findSessionById(store, sessionId);
  if (!s) return false;
  if (status === 'closed' || status === 'open') s.status = status;
  s.updatedAt = new Date().toISOString();
  return true;
}

module.exports = {
  ensureSupport,
  getOrCreateSession,
  findSessionById,
  appendMessage,
  listSessionsForAdmin,
  markAdminRead,
  markUserRead,
  setSessionStatus,
};
