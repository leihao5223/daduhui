/**
 * 游戏房间公屏：用户下注摘要 + 投注机器人确认（持久化 store.gameRoomFeeds）
 */
const crypto = require('crypto');

const GAME_BOTS = {
  'speed-racing': { botName: '澳门娱乐城', gameTitle: '极速赛车' },
  'hk-marksix': { botName: '香港娱乐城', gameTitle: '香港六合彩' },
  'canada-28': { botName: '加拿大娱乐城', gameTitle: 'PC蛋蛋' },
};

const MAX_FEED = 600;

function ensureFeeds(store) {
  if (!store.gameRoomFeeds || typeof store.gameRoomFeeds !== 'object') store.gameRoomFeeds = {};
  for (const slug of Object.keys(GAME_BOTS)) {
    if (!Array.isArray(store.gameRoomFeeds[slug])) store.gameRoomFeeds[slug] = [];
  }
}

function newId() {
  return `gf_${crypto.randomBytes(6).toString('hex')}`;
}

function speedKeyLabel(key) {
  const m = {
    'speed:dx:big': '大',
    'speed:dx:small': '小',
    'speed:ds:odd': '单',
    'speed:ds:even': '双',
  };
  return m[String(key)] || String(key).replace(/^speed:[^:]*:/, '');
}

function shortKeyLabel(slug, key) {
  const k = String(key);
  if (slug === 'speed-racing') return speedKeyLabel(k);
  const parts = k.split(':').filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(':');
  return k.length > 18 ? `${k.slice(0, 16)}…` : k;
}

/**
 * @param {object} store
 * @param {'speed-racing'|'hk-marksix'|'canada-28'} slug
 * @param {string} nickname
 * @param {string} userId
 * @param {string} period
 * @param {{ key: string, stake: number }[]} lines
 * @param {number} total
 * @param {number} balanceAfter
 */
function appendBetPair(store, slug, nickname, userId, period, lines, total, balanceAfter) {
  const cfg = GAME_BOTS[slug];
  if (!cfg || !Array.isArray(lines) || !lines.length) return;
  ensureFeeds(store);
  const nick = String(nickname || '用户').slice(0, 32);
  const posLabel = slug === 'speed-racing' ? '1' : '1';
  const userParts = lines.map((ln) => {
    const lab = shortKeyLabel(slug, ln.key);
    return `${posLabel}/${lab}/${Number(ln.stake)}`;
  });
  const userText = userParts.join(' ');

  const linesDesc = lines
    .map((ln) => {
      const lab = shortKeyLabel(slug, ln.key);
      const head = slug === 'speed-racing' ? '冠军' : '注项';
      return `${head}[${lab}/${Number(ln.stake).toFixed(0)}]`;
    })
    .join('、');

  const robotText = `@${nick} 亲，${cfg.gameTitle} ${period} 期竞猜成功\n当前积分: ${Number(balanceAfter).toFixed(2)}\n本次竞猜总分: ${Number(total).toFixed(2)}\n竞猜内容: ${linesDesc}`;

  const now = new Date().toISOString();
  const arr = store.gameRoomFeeds[slug];
  arr.push({
    id: newId(),
    role: 'user',
    userId: String(userId),
    nickname: nick,
    text: userText,
    createdAt: now,
  });
  arr.push({
    id: newId(),
    role: 'robot',
    botName: cfg.botName,
    verified: true,
    text: robotText,
    createdAt: now,
  });
  while (arr.length > MAX_FEED) arr.shift();
}

function listFeed(store, slug, after, limit) {
  ensureFeeds(store);
  const lim = Math.min(Math.max(Number(limit) || 80, 1), 150);
  let rows = [...(store.gameRoomFeeds[slug] || [])];
  if (after) {
    const idx = rows.findIndex((r) => r.id === after);
    rows = idx >= 0 ? rows.slice(idx + 1) : [];
  } else {
    rows = rows.slice(-200);
  }
  return rows.slice(-lim);
}

module.exports = { ensureFeeds, appendBetPair, listFeed, GAME_BOTS };
