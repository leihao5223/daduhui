import { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppWindow, FileBarChart2, MessageSquare, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiPost } from '../../api/http';
import '../../styles/admin-console.css';

const ADMIN_TOKEN_KEY = 'admin_token';

async function adminFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
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
  nickname: string;
  parentId: string | null;
  parentNickname: string | null;
  registeredViaInviteCode: string | null;
  createdAt: string;
  directDownlineCount: number;
};

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
  const [agentQ, setAgentQ] = useState('');
  const [agentStatus, setAgentStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [activeAgent, setActiveAgent] = useState<Record<string, unknown> | null>(null);
  const [agentReason, setAgentReason] = useState('');
  const [agentNote, setAgentNote] = useState('');

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

  const loadUsers = useCallback(async () => {
    try {
      const r = await adminFetch<{ success: boolean; list: OverviewUser[] }>('/api/admin/users');
      setUserRows(Array.isArray(r.list) ? r.list : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
      setUserRows([]);
    }
  }, []);

  const loadPolicy = useCallback(async () => {
    const r = await adminFetch<{ success: boolean; data?: { companyInfo?: Record<string, unknown> } }>('/api/admin/cms');
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
  }, []);

  const loadAgents = useCallback(async () => {
    const r = await adminFetch<{ success: boolean; list: typeof agents }>('/api/admin/agents');
    setAgents(Array.isArray(r.list) ? r.list : []);
  }, []);

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
    if (pageMode === 'agents') {
      void loadPolicy();
    }
    if (pageMode === 'users') {
      void loadUsers();
    }
  }, [navigate, pageMode, loadBase, loadAgents, loadPolicy, loadUsers]);

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
          )}

          {pageMode === 'users' && (
            <div className="dh-admin-card">
              <h2 className="dh-admin-h2">用户列表 · 上下级与邀请码</h2>
              <p className="dh-admin-text-muted">数据来自大都汇注册（parentId / 邀请码）。账务与星彩对齐后可扩展。</p>
              <div className="dh-admin-table-wrap">
                <table className="dh-admin-table">
                  <thead>
                    <tr>
                      <th>用户</th>
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
            <div className="dh-admin-card">
              <h2 className="dh-admin-h2">输赢报表（代理线）</h2>
              <p className="dh-admin-text-muted">大都汇当前无下单账本聚合；下列为代理团队占位字段。</p>
              <div className="dh-admin-table-wrap">
                <table className="dh-admin-table">
                  <thead>
                    <tr>
                      <th>账号</th>
                      <th>代理码</th>
                      <th>团队人数</th>
                      <th>团队流水</th>
                      <th>下单笔数</th>
                      <th>盈亏</th>
                      <th>回水</th>
                      <th>实际盈亏</th>
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
                        <td>¥{Number(a.teamVolume || 0).toFixed(2)}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

/** ========== 客服管理（占位对齐星彩） ========== */
export function AdminSupportPage() {
  const navigate = useNavigate();
  const [chatSessions] = useState([
    { id: '1', user: 'demo_user', lastMessage: '大都汇客服演示会话', time: '刚刚', unread: 0, status: 'online' },
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
              会话列表（演示）
            </h2>
            <p className="dh-admin-text-muted">完整客服后台可参考星彩 Socket 会话；大都汇可后续接入同一套接口。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className="dh-admin-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '1rem' }}
                  onClick={() => window.alert(`演示：与 ${session.user} 的对话`)}
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
