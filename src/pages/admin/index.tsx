import { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppWindow, FileBarChart2, MessageSquare, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiPost, buildApiUrl } from '../../api/http';
import '../../styles/admin-console.css';

const ADMIN_TOKEN_KEY = 'admin_token';

async function adminFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(buildApiUrl(path), { ...options, headers });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      body = { message: text };
    }
  }
  if (!res.ok) throw new Error(String(body.message || '请求失败'));
  return body as T;
}

/** ========== 管理员登录（契约对齐星彩 /api/admin/login） ========== */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const r = await apiPost<{ success: boolean; token?: string; message?: string }>('/api/admin/login', {
        username: username.trim(),
        password,
      });
      if (!r.success || !r.token) {
        setError(r.message || '登录失败');
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, r.token);
      navigate('/admin/console', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dh-admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dh-admin-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>管理后台</h1>
        <p className="dh-admin-text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          大都汇舞台 · 管理员登录
        </p>

        <form onSubmit={handleSubmit}>
          {error ? (
            <div className="dh-admin-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          ) : null}

          <div style={{ marginBottom: '1rem' }}>
            <label className="dh-admin-label" htmlFor="adm-user">
              管理员账号
            </label>
            <input
              id="adm-user"
              type="text"
              className="dh-admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="默认 admin（见服务端 ADMIN_USERNAME）"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dh-admin-label" htmlFor="adm-pass">
              密码
            </label>
            <input
              id="adm-pass"
              type="password"
              className="dh-admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="见服务端 ADMIN_PASSWORD"
              required
            />
          </div>

          <button type="submit" className="dh-admin-btn dh-admin-btn--primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

type OverviewUser = {
  id: string;
  displayId8: string;
  customerNo: string;
  balance?: number;
  lastIp: string;
  monthHk6Pnl: number;
  nickname: string;
  parentId: string | null;
  parentNickname: string | null;
  registeredViaInviteCode: string | null;
  createdAt: string;
  directDownlineCount: number;
};

type ActivityArticleRow = { id: string; title: string; body: string; updatedAt?: string | null };

type LedgerAdminRow = {
  id: string;
  userId: string;
  nickname: string;
  displayId8: string;
  customerNo: string;
  time: string;
  type: string;
  amount: string;
  status: string;
  ledgerType: string;
};

type BetOrderAdminRow = {
  id: string;
  game: string;
  gameLabel: string;
  userId: string;
  nickname: string;
  displayId8: string;
  customerNo: string;
  period: string;
  amount: number;
  status: string;
  payout: number | null;
  time: string;
  summary: string;
};

function adminTodayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ========== 管理控制台（布局对齐星彩 AdminConsolePage，数据为大都汇） ========== */
export function AdminConsolePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    todayDeposits: 0,
    todayWithdrawals: 0,
    totalOrders: 0,
    activeRooms: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentRule, setAgentRule] = useState({ totalCapPercent: 3, maxLevels: 10, maxPerLevelPercent: 0.3 });
  const [systemSwitch, setSystemSwitch] = useState({
    enableTransfer: true,
    enableVipReward: true,
    enableDrawManual: true,
  });
  const [agents, setAgents] = useState<
    {
      id: string;
      nickname: string;
      loginName?: string;
      agentCode?: string;
      parentAgentId?: string;
      status?: string;
      teamSize?: number;
      teamVolume?: number;
    }[]
  >([]);
  const [userRows, setUserRows] = useState<OverviewUser[]>([]);
  const [userListQ, setUserListQ] = useState('');
  const [agentQ, setAgentQ] = useState('');
  const [agentStatus, setAgentStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [activeAgent, setActiveAgent] = useState<Record<string, unknown> | null>(null);
  const [agentReason, setAgentReason] = useState('');
  const [agentNote, setAgentNote] = useState('');
  const [activityArticles, setActivityArticles] = useState<ActivityArticleRow[]>([
    { id: 'activity-1', title: '', body: '', updatedAt: null },
    { id: 'activity-2', title: '', body: '', updatedAt: null },
    { id: 'activity-3', title: '', body: '', updatedAt: null },
  ]);

  const [finFrom, setFinFrom] = useState(adminTodayYmd);
  const [finTo, setFinTo] = useState(adminTodayYmd);
  const [finQ, setFinQ] = useState('');
  const [finLedgerTypes, setFinLedgerTypes] = useState('deposit,withdraw');
  const [ledgerRows, setLedgerRows] = useState<LedgerAdminRow[]>([]);
  const [betFrom, setBetFrom] = useState(adminTodayYmd);
  const [betTo, setBetTo] = useState(adminTodayYmd);
  const [betQ, setBetQ] = useState('');
  const [betGame, setBetGame] = useState('');
  const [betRows, setBetRows] = useState<BetOrderAdminRow[]>([]);
  const [financeBusy, setFinanceBusy] = useState(false);

  const pageMode = useMemo(() => {
    if (location.pathname === '/admin/agents') return 'agents';
    if (location.pathname === '/admin/finance') return 'winloss';
    if (location.pathname === '/admin/users') return 'users';
    return 'dashboard';
  }, [location.pathname]);

  const loadBase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await adminFetch<{
        success: boolean;
        data: {
          usersTotal?: number;
          onlineNow?: number;
          activeOrders?: number;
          depositsToday?: number;
          withdrawalsToday?: number;
          ordersSettledToday?: number;
        };
      }>('/api/admin/dashboard');
      const d = r.data;
      setStats({
        totalUsers: Number(d.usersTotal || 0),
        onlineUsers: Number(d.onlineNow || 0),
        todayDeposits: Number(d.depositsToday || 0),
        todayWithdrawals: Number(d.withdrawalsToday || 0),
        totalOrders: Number(d.ordersSettledToday || 0),
        activeRooms: Number(d.activeOrders || 0),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (q?: string) => {
    try {
      const query = q !== undefined ? String(q).trim() : '';
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      const r = await adminFetch<{ success: boolean; list: OverviewUser[] }>(`/api/admin/users${qs}`);
      setUserRows(Array.isArray(r.list) ? r.list : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
      setUserRows([]);
    }
  }, []);

  const loadPolicy = useCallback(async () => {
    const r = await adminFetch<{
      success: boolean;
      data?: { companyInfo?: Record<string, unknown>; activityArticles?: ActivityArticleRow[] };
    }>('/api/admin/cms');
    const c = r.data?.companyInfo || {};
    try {
      const j = JSON.parse(String(c.agentRuleJson || '{}'));
      setAgentRule({
        totalCapPercent: Number(j.totalCapPercent || 3),
        maxLevels: Number(j.maxLevels || 10),
        maxPerLevelPercent: Number(j.maxPerLevelPercent || 0.3),
      });
    } catch {
      setAgentRule({ totalCapPercent: 3, maxLevels: 10, maxPerLevelPercent: 0.3 });
    }
    try {
      const j = JSON.parse(String(c.systemSwitchJson || '{}'));
      setSystemSwitch({
        enableTransfer: j.enableTransfer !== false,
        enableVipReward: j.enableVipReward !== false,
        enableDrawManual: j.enableDrawManual !== false,
      });
    } catch {
      setSystemSwitch({ enableTransfer: true, enableVipReward: true, enableDrawManual: true });
    }
    const arts = r.data?.activityArticles;
    if (Array.isArray(arts) && arts.length) {
      const pad: ActivityArticleRow[] = [
        { id: 'activity-1', title: '', body: '', updatedAt: null },
        { id: 'activity-2', title: '', body: '', updatedAt: null },
        { id: 'activity-3', title: '', body: '', updatedAt: null },
      ];
      setActivityArticles(
        [0, 1, 2].map((i) => {
          const row = arts[i];
          if (row && typeof row === 'object') {
            return {
              id: String((row as ActivityArticleRow).id || pad[i].id),
              title: String((row as ActivityArticleRow).title ?? ''),
              body: String((row as ActivityArticleRow).body ?? ''),
              updatedAt: (row as ActivityArticleRow).updatedAt ?? null,
            };
          }
          return pad[i];
        }),
      );
    }
  }, []);

  const loadAgents = useCallback(async () => {
    const r = await adminFetch<{ success: boolean; list: typeof agents }>('/api/admin/agents');
    setAgents(Array.isArray(r.list) ? r.list : []);
  }, []);

  const loadFinanceLedger = useCallback(async () => {
    const qs = new URLSearchParams({
      from: finFrom,
      to: finTo,
      q: finQ.trim(),
      limit: '1500',
    });
    if (finLedgerTypes.trim()) qs.set('types', finLedgerTypes.trim());
    const r = await adminFetch<{ success: boolean; list: LedgerAdminRow[] }>(`/api/admin/finance/ledger?${qs}`);
    setLedgerRows(Array.isArray(r.list) ? r.list : []);
  }, [finFrom, finTo, finQ, finLedgerTypes]);

  const loadFinanceBetOrders = useCallback(async () => {
    const qs = new URLSearchParams({
      from: betFrom,
      to: betTo,
      q: betQ.trim(),
      limit: '1500',
    });
    if (betGame.trim()) qs.set('game', betGame.trim());
    const r = await adminFetch<{ success: boolean; list: BetOrderAdminRow[] }>(`/api/admin/finance/bet-orders?${qs}`);
    setBetRows(Array.isArray(r.list) ? r.list : []);
  }, [betFrom, betTo, betQ, betGame]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    void loadBase();
    if (pageMode === 'agents' || pageMode === 'winloss') {
      void loadAgents();
    }
    if (pageMode === 'agents' || pageMode === 'dashboard') {
      void loadPolicy();
    }
  }, [navigate, pageMode, loadBase, loadAgents, loadPolicy]);

  useEffect(() => {
    if (pageMode !== 'winloss') return;
    let cancelled = false;
    (async () => {
      setFinanceBusy(true);
      setError(null);
      try {
        await Promise.all([loadFinanceLedger(), loadFinanceBetOrders()]);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '财务报表加载失败');
          setLedgerRows([]);
          setBetRows([]);
        }
      } finally {
        if (!cancelled) setFinanceBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageMode, loadFinanceLedger, loadFinanceBetOrders]);

  useEffect(() => {
    if (pageMode !== 'users') return;
    if (!userListQ.trim()) {
      void loadUsers('');
      return;
    }
    const t = window.setTimeout(() => {
      void loadUsers(userListQ);
    }, 320);
    return () => window.clearTimeout(t);
  }, [pageMode, userListQ, loadUsers]);

  async function savePolicy() {
    if (agentRule.maxPerLevelPercent > agentRule.totalCapPercent) {
      window.alert('单层返点不能超过总代理点数上限');
      return;
    }
    await adminFetch('/api/admin/cms/companyInfo', {
      method: 'PUT',
      body: JSON.stringify({
        data: {
          agentRuleJson: JSON.stringify(agentRule, null, 2),
          systemSwitchJson: JSON.stringify(systemSwitch, null, 2),
        },
      }),
    });
    window.alert('代理系统设置已保存');
  }

  async function saveActivityArticles() {
    await adminFetch('/api/admin/cms/activityArticles', {
      method: 'PUT',
      body: JSON.stringify({ articles: activityArticles }),
    });
    window.alert('活动中心已保存');
    await loadPolicy();
  }

  async function openAgentDetail(id: string) {
    const r = await adminFetch<{ success: boolean; data: Record<string, unknown> }>(
      `/api/admin/agents/${encodeURIComponent(id)}/detail`,
    );
    setActiveAgent({ ...r.data });
    setAgentReason('');
    setAgentNote('');
  }

  async function saveAgentDetail() {
    if (!activeAgent) return;
    if (agentReason.trim().length < 2) {
      window.alert('操作原因至少 2 个字');
      return;
    }
    await adminFetch(`/api/admin/agents/${encodeURIComponent(String(activeAgent.id))}`, {
      method: 'PATCH',
      body: JSON.stringify({
        agentCode: String(activeAgent.agentCode || '').trim().toUpperCase(),
        parentAgentId: String(activeAgent.parentAgentId || '').trim(),
        status: activeAgent.status === 'disabled' ? 'disabled' : 'active',
        reason: agentReason.trim(),
        note: agentNote.trim(),
      }),
    });
    await loadAgents();
    await openAgentDetail(String(activeAgent.id));
    window.alert('代理信息已保存');
  }

  const filteredAgents = useMemo(() => {
    const q = agentQ.trim().toLowerCase();
    return (agents || []).filter((a) => {
      const hitQ =
        !q ||
        [a.id, a.nickname, a.loginName, a.agentCode, a.parentAgentId]
          .map((s) => String(s || '').toLowerCase())
          .some((s) => s.includes(q));
      const hitStatus = agentStatus === 'all' ? true : a.status === agentStatus;
      return hitQ && hitStatus;
    });
  }, [agents, agentQ, agentStatus]);

  function handleLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate('/admin/login');
  }

  return (
    <div className="dh-admin-page">
      <header className="dh-admin-page__header">
        <div className="dh-admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="dh-admin-page__title">大都汇 · 管理控制台</h1>
          <button type="button" className="dh-admin-btn dh-admin-btn--outline" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="dh-admin-page__content">
        <div className="dh-admin-container">
          <div className="dh-admin-grid dh-admin-grid--4" style={{ marginBottom: '2rem' }}>
            {(
              [
                { label: '客服管理', Icon: MessageSquare, path: '/admin/support' },
                { label: '用户管理', Icon: Users, path: '/admin/users' },
                { label: '财务报表', Icon: FileBarChart2, path: '/admin/finance' },
                { label: '代理系统', Icon: AppWindow, path: '/admin/agents' },
              ] as { label: string; Icon: LucideIcon; path: string }[]
            ).map((item) => {
              const Ico = item.Icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className="dh-admin-card"
                  onClick={() => navigate(item.path)}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico className="dh-admin-biz-icon" size={28} strokeWidth={1.35} />
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</p>
                </button>
              );
            })}
          </div>
          {error ? <p className="dh-admin-error">{error}</p> : null}
          {loading ? <p className="dh-admin-text-muted">加载中…</p> : null}

          {pageMode === 'dashboard' && (
            <>
              <div className="dh-admin-grid dh-admin-grid--3">
                <div className="dh-admin-card">
                  <b>{stats.totalUsers}</b>
                  <p className="dh-admin-text-muted">总用户数</p>
                </div>
                <div className="dh-admin-card">
                  <b>{stats.onlineUsers}</b>
                  <p className="dh-admin-text-muted">在线用户</p>
                </div>
                <div className="dh-admin-card">
                  <b>¥{stats.todayDeposits}</b>
                  <p className="dh-admin-text-muted">今日存款</p>
                </div>
                <div className="dh-admin-card">
                  <b>¥{stats.todayWithdrawals}</b>
                  <p className="dh-admin-text-muted">今日取款</p>
                </div>
                <div className="dh-admin-card">
                  <b>{stats.totalOrders}</b>
                  <p className="dh-admin-text-muted">今日结算订单</p>
                </div>
                <div className="dh-admin-card">
                  <b>{stats.activeRooms}</b>
                  <p className="dh-admin-text-muted">活跃订单</p>
                </div>
              </div>
              <div className="dh-admin-card" style={{ marginTop: '1.5rem' }}>
                <h2 className="dh-admin-h2">活动中心</h2>
                <p className="dh-admin-text-muted">前台底部「活动」页固定展示 3 条，标题与正文可为空。</p>
                {activityArticles.map((row, idx) => (
                  <div key={row.id} style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>第 {idx + 1} 条</p>
                    <label className="dh-admin-label" style={{ display: 'block', marginBottom: 8 }}>
                      标题
                      <input
                        className="dh-admin-input"
                        value={row.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setActivityArticles((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                          );
                        }}
                      />
                    </label>
                    <label className="dh-admin-label" style={{ display: 'block' }}>
                      正文
                      <textarea
                        className="dh-admin-input"
                        style={{ minHeight: 100, resize: 'vertical' }}
                        value={row.body}
                        onChange={(e) => {
                          const v = e.target.value;
                          setActivityArticles((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, body: v } : x)),
                          );
                        }}
                      />
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="dh-admin-btn dh-admin-btn--primary"
                  onClick={() => void saveActivityArticles()}
                >
                  保存活动页
                </button>
              </div>
            </>
          )}

          {pageMode === 'users' && (
            <div className="dh-admin-card">
              <h2 className="dh-admin-h2">用户列表 · 上下级与邀请码</h2>
              <p className="dh-admin-text-muted">
                数据来自大都汇注册（parentId / 邀请码）。可按 8 位展示 ID、客户号、昵称、IP 或内部 id 搜索（与充值客服留言中的 id 一致）。
              </p>
              <label className="dh-admin-label" style={{ display: 'block', marginBottom: '1rem', maxWidth: '420px' }}>
                搜索用户
                <input
                  className="dh-admin-input"
                  type="search"
                  placeholder="8 位 ID / 客户号 / 昵称"
                  value={userListQ}
                  onChange={(e) => setUserListQ(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <div className="dh-admin-table-wrap">
                <table className="dh-admin-table">
                  <thead>
                    <tr>
                      <th>用户</th>
                      <th>展示 ID（8 位）</th>
                      <th>客户号</th>
                      <th>余额</th>
                      <th>最近 IP</th>
                      <th>当月港彩盈亏</th>
                      <th>上级</th>
                      <th>注册邀请码</th>
                      <th>直属下级数</th>
                      <th>注册时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRows.map((u) => (
                      <tr key={u.id}>
                        <td>
                          {u.nickname}
                          <br />
                          <span className="dh-admin-text-muted">{u.id}</span>
                        </td>
                        <td>
                          <code>{u.displayId8 || '—'}</code>
                        </td>
                        <td>
                          <code>{u.customerNo || '—'}</code>
                        </td>
                        <td>¥{typeof u.balance === 'number' ? u.balance.toFixed(2) : '—'}</td>
                        <td>
                          <code>{u.lastIp || '—'}</code>
                        </td>
                        <td>
                          {typeof u.monthHk6Pnl === 'number' ? `¥${u.monthHk6Pnl.toFixed(2)}` : '—'}
                        </td>
                        <td>{u.parentNickname ?? '—'}</td>
                        <td>
                          <code>{u.registeredViaInviteCode ?? '—'}</code>
                        </td>
                        <td>{u.directDownlineCount}</td>
                        <td>{new Date(u.createdAt).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pageMode === 'winloss' && (
            <>
              <div className="dh-admin-card" style={{ marginBottom: '1.25rem' }}>
                <h2 className="dh-admin-h2">代理线概览</h2>
                <p className="dh-admin-text-muted">团队人数、账户余额（与前台个人中心一致）；团队流水等细账可后续接账本。</p>
                <div className="dh-admin-table-wrap">
                  <table className="dh-admin-table">
                    <thead>
                      <tr>
                        <th>账号</th>
                        <th>代理码</th>
                        <th>团队人数</th>
                        <th>余额</th>
                        <th>团队流水</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.map((a) => (
                        <tr key={a.id}>
                          <td>
                            {a.id}/{a.nickname}
                          </td>
                          <td>{a.agentCode || '—'}</td>
                          <td>{a.teamSize}</td>
                          <td>¥{Number(a.account?.available ?? 0).toFixed(2)}</td>
                          <td>¥{Number(a.teamVolume || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dh-admin-card" style={{ marginBottom: '1.25rem' }}>
                <h2 className="dh-admin-h2">全站资金流水（充值 / 提现 / 派彩等）</h2>
                <p className="dh-admin-text-muted">按上海自然日筛选；types 逗号分隔，如 deposit,withdraw 或留空表示全部类型。</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
                  <label className="dh-admin-label" style={{ margin: 0 }}>
                    开始
                    <input className="dh-admin-input" type="date" value={finFrom} onChange={(e) => setFinFrom(e.target.value)} />
                  </label>
                  <label className="dh-admin-label" style={{ margin: 0 }}>
                    结束
                    <input className="dh-admin-input" type="date" value={finTo} onChange={(e) => setFinTo(e.target.value)} />
                  </label>
                  <label className="dh-admin-label" style={{ margin: 0, flex: '1 1 180px' }}>
                    用户筛选
                    <input
                      className="dh-admin-input"
                      placeholder="昵称 / 展示ID / 客户号"
                      value={finQ}
                      onChange={(e) => setFinQ(e.target.value)}
                    />
                  </label>
                  <label className="dh-admin-label" style={{ margin: 0, flex: '1 1 200px' }}>
                    ledger types
                    <input
                      className="dh-admin-input"
                      placeholder="deposit,withdraw 或留空=全部"
                      value={finLedgerTypes}
                      onChange={(e) => setFinLedgerTypes(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="dh-admin-btn dh-admin-btn--primary"
                    onClick={() => {
                      void (async () => {
                        setFinanceBusy(true);
                        setError(null);
                        try {
                          await loadFinanceLedger();
                        } catch (e: unknown) {
                          setError(e instanceof Error ? e.message : '资金流水加载失败');
                        } finally {
                          setFinanceBusy(false);
                        }
                      })();
                    }}
                  >
                    查询流水
                  </button>
                </div>
                {financeBusy ? <p className="dh-admin-text-muted">加载中…</p> : null}
                <div className="dh-admin-table-wrap">
                  <table className="dh-admin-table">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>用户</th>
                        <th>展示ID</th>
                        <th>类型</th>
                        <th>金额</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.time}</td>
                          <td>
                            {r.nickname}
                            <br />
                            <span className="dh-admin-text-muted">{r.userId}</span>
                          </td>
                          <td>
                            <code>{r.displayId8 || '—'}</code>
                          </td>
                          <td>{r.type}</td>
                          <td>{r.amount}</td>
                          <td>{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dh-admin-card">
                <h2 className="dh-admin-h2">全站游戏注单</h2>
                <p className="dh-admin-text-muted">港彩 / PC28 / 急速赛车；与前台「订单明细」同一套合并规则。</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
                  <label className="dh-admin-label" style={{ margin: 0 }}>
                    开始
                    <input className="dh-admin-input" type="date" value={betFrom} onChange={(e) => setBetFrom(e.target.value)} />
                  </label>
                  <label className="dh-admin-label" style={{ margin: 0 }}>
                    结束
                    <input className="dh-admin-input" type="date" value={betTo} onChange={(e) => setBetTo(e.target.value)} />
                  </label>
                  <label className="dh-admin-label" style={{ margin: 0, flex: '1 1 160px' }}>
                    用户筛选
                    <input className="dh-admin-input" placeholder="昵称 / ID" value={betQ} onChange={(e) => setBetQ(e.target.value)} />
                  </label>
                  <label className="dh-admin-label" style={{ margin: 0 }}>
                    游戏
                    <select className="dh-admin-input" value={betGame} onChange={(e) => setBetGame(e.target.value)}>
                      <option value="">全部</option>
                      <option value="hk6">香港六合彩</option>
                      <option value="ca28">PC28</option>
                      <option value="speed">急速赛车</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="dh-admin-btn dh-admin-btn--primary"
                    onClick={() => {
                      void (async () => {
                        setFinanceBusy(true);
                        setError(null);
                        try {
                          await loadFinanceBetOrders();
                        } catch (e: unknown) {
                          setError(e instanceof Error ? e.message : '注单加载失败');
                        } finally {
                          setFinanceBusy(false);
                        }
                      })();
                    }}
                  >
                    查询注单
                  </button>
                </div>
                <div className="dh-admin-table-wrap">
                  <table className="dh-admin-table">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>游戏</th>
                        <th>用户</th>
                        <th>期号</th>
                        <th>金额</th>
                        <th>派彩</th>
                        <th>状态</th>
                        <th>摘要</th>
                      </tr>
                    </thead>
                    <tbody>
                      {betRows.map((r) => (
                        <tr key={`${r.game}-${r.id}`}>
                          <td>{r.time}</td>
                          <td>{r.gameLabel}</td>
                          <td>
                            {r.nickname}
                            <br />
                            <span className="dh-admin-text-muted">{r.userId}</span>
                          </td>
                          <td>{r.period}</td>
                          <td>¥{Number(r.amount).toFixed(2)}</td>
                          <td>{r.payout != null ? `¥${Number(r.payout).toFixed(2)}` : '—'}</td>
                          <td>{r.status}</td>
                          <td style={{ maxWidth: 220, wordBreak: 'break-all' }}>{r.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {pageMode === 'agents' && (
            <>
              <div className="dh-admin-card">
                <h2 className="dh-admin-h2">代理系统设置</h2>
                <div className="dh-admin-grid dh-admin-grid--3">
                  <label className="dh-admin-label">
                    总代理点数上限(%)
                    <input
                      className="dh-admin-input"
                      type="number"
                      value={agentRule.totalCapPercent}
                      onChange={(e) => setAgentRule((p) => ({ ...p, totalCapPercent: Number(e.target.value || 0) }))}
                    />
                  </label>
                  <label className="dh-admin-label">
                    最大层级数
                    <input
                      className="dh-admin-input"
                      type="number"
                      min={1}
                      max={10}
                      value={agentRule.maxLevels}
                      onChange={(e) => setAgentRule((p) => ({ ...p, maxLevels: Number(e.target.value || 1) }))}
                    />
                  </label>
                  <label className="dh-admin-label">
                    单层最高返点(%)
                    <input
                      className="dh-admin-input"
                      type="number"
                      value={agentRule.maxPerLevelPercent}
                      onChange={(e) => setAgentRule((p) => ({ ...p, maxPerLevelPercent: Number(e.target.value || 0) }))}
                    />
                  </label>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={systemSwitch.enableTransfer}
                      onChange={(e) => setSystemSwitch((p) => ({ ...p, enableTransfer: e.target.checked }))}
                    />{' '}
                    会员互转
                  </label>
                  <label style={{ marginLeft: 12 }}>
                    <input
                      type="checkbox"
                      checked={systemSwitch.enableVipReward}
                      onChange={(e) => setSystemSwitch((p) => ({ ...p, enableVipReward: e.target.checked }))}
                    />{' '}
                    VIP 奖励
                  </label>
                  <label style={{ marginLeft: 12 }}>
                    <input
                      type="checkbox"
                      checked={systemSwitch.enableDrawManual}
                      onChange={(e) => setSystemSwitch((p) => ({ ...p, enableDrawManual: e.target.checked }))}
                    />{' '}
                    手动开奖
                  </label>
                </div>
                <button type="button" className="dh-admin-btn dh-admin-btn--primary" style={{ marginTop: 12 }} onClick={() => void savePolicy()}>
                  保存系统设置
                </button>
              </div>

              <div className="dh-admin-card">
                <h2 className="dh-admin-h2">代理列表（会员 + 邀请码 / 上级）</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    className="dh-admin-input"
                    placeholder="昵称 / 代理码 / 上级ID"
                    value={agentQ}
                    onChange={(e) => setAgentQ(e.target.value)}
                    style={{ flex: '1 1 200px' }}
                  />
                  <select className="dh-admin-input" value={agentStatus} onChange={(e) => setAgentStatus(e.target.value as 'all' | 'active' | 'disabled')}>
                    <option value="all">全部状态</option>
                    <option value="active">正常</option>
                    <option value="disabled">已禁用</option>
                  </select>
                </div>
                <div className="dh-admin-table-wrap">
                  <table className="dh-admin-table">
                    <thead>
                      <tr>
                        <th>用户</th>
                        <th>代理码</th>
                        <th>状态</th>
                        <th>团队人数</th>
                        <th>团队流水</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.map((a) => (
                        <tr key={a.id}>
                          <td>
                            {a.nickname}
                            <br />
                            {a.id}
                          </td>
                          <td>{a.agentCode || '—'}</td>
                          <td>{a.status === 'disabled' ? '已禁用' : '正常'}</td>
                          <td>{a.teamSize}</td>
                          <td>{a.teamVolume}</td>
                          <td>
                            <button type="button" className="dh-admin-btn dh-admin-btn--ghost" onClick={() => void openAgentDetail(a.id)}>
                              详情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeAgent ? (
            <div className="dh-admin-modal-backdrop" onClick={() => setActiveAgent(null)} role="presentation">
              <div className="dh-admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>代理详情</h3>
                <p className="dh-admin-text-muted" style={{ marginBottom: '1rem' }}>
                  上级链（根→直属）：{(activeAgent.uplines as { nickname: string }[] | undefined)?.map((x) => x.nickname).join(' → ') || '顶级'}
                </p>
                <label>
                  展示用代理码（对应邀请码）
                  <input
                    className="dh-admin-input"
                    value={String(activeAgent.agentCode || '')}
                    onChange={(e) => setActiveAgent({ ...activeAgent, agentCode: e.target.value })}
                  />
                </label>
                <label>
                  上级用户 ID
                  <input
                    className="dh-admin-input"
                    value={String(activeAgent.parentAgentId ?? '')}
                    onChange={(e) => setActiveAgent({ ...activeAgent, parentAgentId: e.target.value })}
                  />
                </label>
                <label>
                  状态
                  <select
                    className="dh-admin-input"
                    value={String(activeAgent.status || 'active')}
                    onChange={(e) => setActiveAgent({ ...activeAgent, status: e.target.value })}
                  >
                    <option value="active">正常</option>
                    <option value="disabled">已禁用</option>
                  </select>
                </label>
                <label>
                  操作原因（必填）
                  <input className="dh-admin-input" value={agentReason} onChange={(e) => setAgentReason(e.target.value)} />
                </label>
                <label>
                  备注（选填）
                  <input className="dh-admin-input" value={agentNote} onChange={(e) => setAgentNote(e.target.value)} />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="dh-admin-btn dh-admin-btn--primary" onClick={() => void saveAgentDetail()}>
                    保存
                  </button>
                  <button type="button" className="dh-admin-btn dh-admin-btn--ghost" onClick={() => setActiveAgent(null)}>
                    关闭
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

/** ========== 客服管理 ========== */
export function AdminSupportPage() {
  const navigate = useNavigate();
  const [chatSessions] = useState([
    { id: '1', user: 'guest_001', lastMessage: '咨询账户问题', time: '刚刚', unread: 0, status: 'online' },
  ]);

  return (
    <div className="dh-admin-page">
      <header className="dh-admin-page__header">
        <div className="dh-admin-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="dh-admin-btn dh-admin-btn--ghost" onClick={() => navigate('/admin/console')}>
            ← 返回
          </button>
          <h1 className="dh-admin-page__title">客服管理</h1>
        </div>
      </header>

      <main className="dh-admin-page__content">
        <div className="dh-admin-container">
          <div className="dh-admin-card">
            <h2 className="dh-admin-h2">
              <MessageSquare className="dh-admin-biz-icon" size={18} strokeWidth={1.5} />
              会话列表
            </h2>
            <p className="dh-admin-text-muted">完整客服后台可参考星彩 Socket 会话；大都汇可后续接入同一套接口。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className="dh-admin-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '1rem' }}
                  onClick={() => window.alert(`打开与 ${session.user} 的对话`)}
                >
                  <div>
                    <p style={{ fontWeight: 600 }}>{session.user}</p>
                    <p className="dh-admin-text-muted" style={{ marginTop: 4 }}>
                      {session.lastMessage}
                    </p>
                  </div>
                  <span className="dh-admin-text-muted">{session.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
