const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env = {}, argv) => {
  const isProd = argv.mode === 'production';
  /** Dev-only: `--env mockApi` wires a minimal in-process /api handler. */
  const mockApi =
    Boolean(env.mockApi) ||
    process.env.PANGXIE_MOCK_API === '1' ||
    process.env.PANGXIE_MOCK_API === 'true';

  const devServerExtras =
    !isProd && mockApi
      ? {
          setupMiddlewares(middlewares) {
            /** Session map keyed by Bearer token when mockApi is on. */
            const mockSessions = new Map();

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

            function getBearer(req) {
              const h = req.headers.authorization;
              if (!h || !h.startsWith('Bearer ')) return '';
              return h.slice(7).trim();
            }

            function getMockSession(token) {
              if (!token) return null;
              if (!mockSessions.has(token)) {
                const userId = `mock_${(mockSessions.size + 1).toString(36)}`;
                mockSessions.set(token, {
                  userId,
                  customerNo: String(310000 + mockSessions.size),
                  displayId8: derivedDisplayId8FromSeed(userId),
                  balance: 8888.88,
                  ledger: [],
                  mockBetOrders: [],
                  security: [
                    { questionId: 'q1', answer: 'mock' },
                    { questionId: 'q2', answer: 'mock2' },
                  ],
                });
              }
              return mockSessions.get(token);
            }

            function readJsonBody(req) {
              return new Promise((resolve) => {
                let raw = '';
                req.on('data', (c) => {
                  raw += c;
                });
                req.on('end', () => {
                  try {
                    resolve(raw ? JSON.parse(raw) : {});
                  } catch {
                    resolve({});
                  }
                });
              });
            }

            function sendJson(res, status, obj) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = status;
              res.end(JSON.stringify(obj));
            }

            const hk6LastDraw = {
              period: 'HK2026000',
              balls: ['06', '12', '18', '22', '31', '44'],
              special: '02',
              drawnAt: new Date().toISOString(),
            };

            const devApiMock = (req, res, next) => {
              const pathOnly = (req.url || '').split('?')[0];

              if (req.method === 'GET' && pathOnly === '/api/auth/security-question-presets') {
                sendJson(res, 200, {
                  success: true,
                  list: [
                    { id: 'q1', text: '你的小学名字是什么？' },
                    { id: 'q2', text: '你最喜欢的颜色是什么？' },
                    { id: 'q3', text: '你的出生地是哪里？' },
                    { id: 'q4', text: '你最好的朋友名字是什么？' },
                  ],
                  rows: [],
                });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/activity/articles') {
                sendJson(res, 200, {
                  success: true,
                  list: [
                    { id: 'activity-1', title: '', body: '', updatedAt: null },
                    { id: 'activity-2', title: '', body: '', updatedAt: null },
                    { id: 'activity-3', title: '', body: '', updatedAt: null },
                  ],
                });
                return;
              }

              if (req.method === 'POST' && pathOnly === '/api/auth/register') {
                void readJsonBody(req).then((body) => {
                  let inviteNote = '';
                  if (body.inviteCode && String(body.inviteCode).trim()) {
                    inviteNote = `（邀请码 ${String(body.inviteCode).trim()}）`;
                  }
                  sendJson(res, 200, {
                    success: true,
                    message: `注册成功${inviteNote}`,
                    token: `dev.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 11)}`,
                  });
                });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/me/summary') {
                const s = getMockSession(getBearer(req));
                if (!s) {
                  sendJson(res, 401, { success: false, message: '请先登录' });
                  return;
                }
                sendJson(res, 200, {
                  success: true,
                  data: {
                    nameMask: '玩**',
                    customerNo: String(s.customerNo),
                    displayId8: String(s.displayId8 || ''),
                    userId: s.userId,
                    totalAsset: Number(s.balance.toFixed(2)),
                    available: Number(s.balance.toFixed(2)),
                    frozen: 0,
                    currency: 'CNY',
                    creditScore: 100,
                    accountPnl: 0,
                    todayPnl: 0,
                  },
                });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/me/wallet-records') {
                const s = getMockSession(getBearer(req));
                if (!s) {
                  sendJson(res, 401, { success: false, message: '请先登录' });
                  return;
                }
                const q = new URLSearchParams((req.url || '').split('?')[1] || '');
                const lim = Math.min(Math.max(Number(q.get('limit')) || 200, 1), 500);
                const typesRaw = q.get('types');
                const types = typesRaw ? typesRaw.split(',').map((x) => x.trim()).filter(Boolean) : null;
                let rows = [...s.ledger];
                if (types && types.length) {
                  rows = rows.filter((r) => types.includes(String(r.ledgerType || '')));
                }
                rows.reverse();
                rows = rows.slice(0, lim);
                const list = rows.map((r) => ({
                  id: r.id,
                  time: r.time || new Date(r.createdAt || Date.now()).toLocaleString('zh-CN'),
                  type: r.type,
                  amount: r.amount,
                  status: r.status,
                  ledgerType: r.ledgerType || '',
                }));
                sendJson(res, 200, { success: true, list });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/me/bet-orders') {
                const s = getMockSession(getBearer(req));
                if (!s) {
                  sendJson(res, 401, { success: false, message: '请先登录' });
                  return;
                }
                if (!Array.isArray(s.mockBetOrders)) s.mockBetOrders = [];
                const list =
                  s.mockBetOrders.length > 0
                    ? [...s.mockBetOrders].reverse()
                    : [
                        {
                          id: 'mock_bo_seed',
                          gameLabel: '香港六合彩',
                          period: 'HK2026001',
                          amount: 10,
                          status: '已接单',
                          payout: null,
                          time: new Date().toLocaleString('zh-CN'),
                          summary: 'hk6:tm:01×10',
                        },
                      ];
                sendJson(res, 200, { success: true, list });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/me/security-for-password') {
                const s = getMockSession(getBearer(req));
                if (!s) {
                  sendJson(res, 401, { success: false, message: '请先登录' });
                  return;
                }
                const sec = Array.isArray(s.security) ? s.security : [];
                const questions = sec
                  .map((row) => {
                    const id = String(row.questionId || '');
                    const map = {
                      q1: '你的小学名字是什么？',
                      q2: '你最喜欢的颜色是什么？',
                      q3: '你的出生地是哪里？',
                      q4: '你最好的朋友名字是什么？',
                    };
                    const text = map[id];
                    return id && text ? { id, text } : null;
                  })
                  .filter(Boolean);
                if (!questions.length) {
                  sendJson(res, 200, { success: false, message: '当前账号未设置密保' });
                  return;
                }
                sendJson(res, 200, { success: true, questions });
                return;
              }

              if (req.method === 'POST' && pathOnly === '/api/me/change-password') {
                void readJsonBody(req).then((body) => {
                  const s = getMockSession(getBearer(req));
                  if (!s) {
                    sendJson(res, 401, { success: false, message: '请先登录' });
                    return;
                  }
                  const qid = String(body.questionId || '').trim();
                  const ans = String(body.answer || '').trim().toLowerCase();
                  const sec = Array.isArray(s.security) ? s.security : [];
                  const ok = sec.some(
                    (row) =>
                      String(row.questionId || '').trim() === qid &&
                      String(row.answer || '').trim().toLowerCase() === ans,
                  );
                  if (!ok) {
                    sendJson(res, 200, { success: false, message: '密保答案不正确' });
                    return;
                  }
                  sendJson(res, 200, { success: true, message: '登录密码已更新（mock 模式未持久化）' });
                });
                return;
              }

              if (req.method === 'POST' && pathOnly === '/api/deposit/submit') {
                void readJsonBody(req).then((body) => {
                  const s = getMockSession(getBearer(req));
                  if (!s) {
                    sendJson(res, 401, { success: false, message: '请先登录' });
                    return;
                  }
                  const amount = Number(body.amount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    sendJson(res, 200, { success: false, message: '请输入有效充值金额' });
                    return;
                  }
                  s.balance = Number((s.balance + amount).toFixed(2));
                  const id = `tx_mock_${Date.now()}`;
                  s.ledger.push({
                    id,
                    createdAt: Date.now(),
                    time: new Date().toLocaleString('zh-CN'),
                    type: '在线充值',
                    amount: `+${amount.toFixed(2)}`,
                    status: '成功',
                    ledgerType: 'deposit',
                  });
                  sendJson(res, 200, {
                    success: true,
                    message: '到账成功',
                    balance: s.balance,
                    displayId8: String(s.displayId8 || ''),
                  });
                });
                return;
              }

              if (req.method === 'POST' && pathOnly === '/api/withdraw/request') {
                void readJsonBody(req).then((body) => {
                  const s = getMockSession(getBearer(req));
                  if (!s) {
                    sendJson(res, 401, { success: false, message: '请先登录' });
                    return;
                  }
                  const amount = Number(body.amount);
                  const pwd = String(body.tradePassword || '');
                  if (!Number.isFinite(amount) || amount < 100) {
                    sendJson(res, 200, { success: false, message: '单笔提现金额须不少于 100 元' });
                    return;
                  }
                  if (!/^\d{6}$/.test(pwd)) {
                    sendJson(res, 200, { success: false, message: '交易密码须为 6 位数字' });
                    return;
                  }
                  if (s.balance < amount) {
                    sendJson(res, 200, { success: false, message: '余额不足' });
                    return;
                  }
                  s.balance = Number((s.balance - amount).toFixed(2));
                  s.ledger.push({
                    id: `tx_mock_w_${Date.now()}`,
                    createdAt: Date.now(),
                    time: new Date().toLocaleString('zh-CN'),
                    type: '提现申请',
                    amount: `-${amount.toFixed(2)}`,
                    status: '处理中',
                    ledgerType: 'withdraw',
                  });
                  sendJson(res, 200, { success: true, message: '提现申请已提交' });
                });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/game/hk-marksix/status') {
                const cycle = 180;
                const now = Math.floor(Date.now() / 1000);
                const countdownSec = cycle - (now % cycle);
                sendJson(res, 200, {
                  success: true,
                  currentPeriod: 'HK2026001',
                  countdownSec,
                  lastDraw: hk6LastDraw,
                });
                return;
              }

              if (req.method === 'GET' && pathOnly === '/api/game/hk-marksix/history') {
                const ballsStr = [...hk6LastDraw.balls, hk6LastDraw.special].join(',');
                sendJson(res, 200, {
                  success: true,
                  list: [
                    {
                      period: hk6LastDraw.period,
                      balls: ballsStr,
                      numbers: { main: hk6LastDraw.balls, special: hk6LastDraw.special },
                      time: new Date(hk6LastDraw.drawnAt).toLocaleString('zh-CN'),
                    },
                  ],
                });
                return;
              }

              if (req.method === 'POST' && pathOnly === '/api/game/hk-marksix/bet') {
                void readJsonBody(req).then((body) => {
                  const s = getMockSession(getBearer(req));
                  if (!s) {
                    sendJson(res, 401, { success: false, message: '请先登录' });
                    return;
                  }
                  const lines = Array.isArray(body.lines) ? body.lines : [];
                  let total = 0;
                  for (const row of lines) {
                    const stake = Number(row.stake);
                    if (!Number.isFinite(stake) || stake <= 0) {
                      sendJson(res, 400, { success: false, message: '每注金额须大于 0' });
                      return;
                    }
                    total += stake;
                  }
                  if (lines.length === 0) {
                    sendJson(res, 400, { success: false, message: '请选择注项' });
                    return;
                  }
                  if (s.balance < total) {
                    sendJson(res, 400, { success: false, message: '余额不足' });
                    return;
                  }
                  s.balance = Number((s.balance - total).toFixed(2));
                  const betId = `hk6_mock_${Date.now()}`;
                  const nowTs = Date.now();
                  s.ledger.push({
                    id: `tx_mock_hk6_${nowTs}`,
                    createdAt: nowTs,
                    time: new Date(nowTs).toLocaleString('zh-CN'),
                    type: '香港六合彩-下注',
                    amount: `-${total.toFixed(2)}`,
                    status: '成功',
                    ledgerType: 'bet',
                  });
                  if (!Array.isArray(s.mockBetOrders)) s.mockBetOrders = [];
                  s.mockBetOrders.push({
                    id: betId,
                    gameLabel: '香港六合彩',
                    period: 'HK2026001',
                    amount: total,
                    status: '已接单',
                    payout: null,
                    time: new Date(nowTs).toLocaleString('zh-CN'),
                    summary: `hk6:${lines.length}注×${total.toFixed(2)}`,
                  });
                  sendJson(res, 200, {
                    success: true,
                    message: '下注成功',
                    betId,
                    period: 'HK2026001',
                    total,
                  });
                });
                return;
              }

              next();
            };
            return [devApiMock, ...middlewares];
          },
        }
      : {};

  /** 与星彩一致：留空走同域 /api（devServer 代理到后端）；直连时设环境变量 API_BASE */
  const apiBase = process.env.API_BASE ? String(process.env.API_BASE).replace(/\/$/, '') : '';

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      // 生产环境必须用站点根路径，否则在 /game/xxx 等子路径刷新时相对 bundle.js 会跑到 /game/bundle.js 导致白屏
      publicPath: isProd ? '/' : 'auto',
    },
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-react',
                  {
                    runtime: 'automatic',
                    development: !isProd
                  }
                ],
                '@babel/preset-env',
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        },
        {
          test: /\.(png|jpe?g|gif|webp|ico|svg)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } }
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource'
        },
        {
          // 其余类型：PDF、文档、音视频等资源打包规则
          exclude: /\.(js|jsx|ts|tsx|mjs|css|json|html)$/i,
          type: 'asset/resource'
        }
      ]
    },
    resolve: {
      extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx']
    },
    devServer: {
      port: 3266,
      allowedHosts: 'all',
      historyApiFallback: {
        index: '/index.html',
        rewrites: [
          { from: /^\/_p\/\d+\//, to: '/index.html' }
        ]
      },
      proxy: [
        {
          context: ['/api'],
          target: process.env.PANGXIE_DEV_API || 'http://127.0.0.1:3301',
          changeOrigin: true,
        },
      ],
      ...devServerExtras,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.API_BASE': JSON.stringify(apiBase),
      }),
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body'
      })
    ]
  };
};
