const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env = {}, argv) => {
  const isProd = argv.mode === 'production';
  /** `webpack serve --env mockApi` 或 `PANGXIE_MOCK_API=1`：无后端时模拟注册/密保接口 */
  const mockApi =
    Boolean(env.mockApi) ||
    process.env.PANGXIE_MOCK_API === '1' ||
    process.env.PANGXIE_MOCK_API === 'true';

  const devServerExtras =
    !isProd && mockApi
      ? {
          setupMiddlewares(middlewares) {
            /** 按 Bearer token 分会话，支撑 dev:mock 下 summary / 充值 / 流水 / 港彩 */
            const mockSessions = new Map();

            function getBearer(req) {
              const h = req.headers.authorization;
              if (!h || !h.startsWith('Bearer ')) return '';
              return h.slice(7).trim();
            }

            function getMockSession(token) {
              if (!token) return null;
              if (!mockSessions.has(token)) {
                mockSessions.set(token, {
                  userId: `mock_${(mockSessions.size + 1).toString(36)}`,
                  customerNo: String(310000 + mockSessions.size),
                  balance: 8888.88,
                  ledger: [],
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

              if (req.method === 'POST' && pathOnly === '/api/auth/register') {
                void readJsonBody(req).then((body) => {
                  let inviteNote = '';
                  if (body.inviteCode && String(body.inviteCode).trim()) {
                    inviteNote = `（邀请码 ${String(body.inviteCode).trim()} 已在模拟环境校验占位）`;
                  }
                  sendJson(res, 200, {
                    success: true,
                    message: `注册成功（开发模拟）${inviteNote}`,
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
                const lim = Math.min(Math.max(Number(q.get('limit')) || 100, 1), 500);
                const list = [...s.ledger].slice(-lim).reverse().map((r) => ({
                  id: r.id,
                  time: r.time,
                  type: r.type,
                  amount: r.amount,
                  status: r.status,
                }));
                sendJson(res, 200, { success: true, list });
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
                    time: new Date().toLocaleString('zh-CN'),
                    type: '在线充值',
                    amount: `+${amount.toFixed(2)}`,
                    status: '成功',
                  });
                  sendJson(res, 200, {
                    success: true,
                    message: '到账成功（开发模拟）',
                    balance: s.balance,
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
                    sendJson(res, 200, { success: false, message: '交易密码须为 6 位数字（模拟环境任意 6 位数字可通过）' });
                    return;
                  }
                  if (s.balance < amount) {
                    sendJson(res, 200, { success: false, message: '余额不足' });
                    return;
                  }
                  s.balance = Number((s.balance - amount).toFixed(2));
                  s.ledger.push({
                    id: `tx_mock_w_${Date.now()}`,
                    time: new Date().toLocaleString('zh-CN'),
                    type: '提现申请',
                    amount: `-${amount.toFixed(2)}`,
                    status: '处理中',
                  });
                  sendJson(res, 200, { success: true, message: '提现申请已提交（开发模拟）' });
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
                  s.ledger.push({
                    id: `tx_mock_hk6_${Date.now()}`,
                    time: new Date().toLocaleString('zh-CN'),
                    type: '香港六合彩-下注',
                    amount: `-${total.toFixed(2)}`,
                    status: '成功',
                  });
                  sendJson(res, 200, {
                    success: true,
                    message: '下注成功（开发模拟）',
                    betId: `hk6_mock_${Date.now()}`,
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
      publicPath: 'auto'
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
          // 兜底规则：PDF、文档、音视频等所有其他文件一律输出为独立资源文件
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
          target: 'http://localhost:3301',
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
