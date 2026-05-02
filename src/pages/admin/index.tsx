import { useState, FormEvent, useEffect, useMemo, useCallback, useRef } from 'react';
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

type AdminUserDetail = {
  id: string;
  nickname: string;
  displayId8: string;
  customerNo: string;
  inviteCodeDisplay?: string;
  balance: number;
  parentId: string | null;
  agentStatus: string;
  createdAt: string | null;
  lastIp: string;
  lastIpAt: string | null;
  registeredViaInviteCode: string | null;
  hasLoginPassword: boolean;
  hasTradePassword: boolean;
  securityQuestions: { questionId: string }[];
};

type UserEditFormState = {
  nickname: string;
  displayId8: string;
  customerNo: string;
  parentId: string;
  agentStatus: string;
  balanceMode: 'none' | 'delta' | 'set';
  balanceValue: string;
  newLoginPassword: string;
  newLoginPasswordConfirm: string;
  newTradePassword: string;
  sec1Q: string;
  sec1A: string;
  sec2Q: string;
  sec2A: string;
  inviteCodeDisplay: string;
  reason: string;
};

type SecurityPresetRow = { id: string; text: string };

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

  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [userEditDetail, setUserEditDetail] = useState<AdminUserDetail | null>(null);
  const [userEditForm, setUserEditForm] = useState<UserEditFormState | null>(null);
  const [userEditSaving, setUserEditSaving] = useState(false);
  const [secPresets, setSecPresets] = useState<SecurityPresetRow[]>([
    { id: 'q1', text: '你的小学名字是什么？' },
    { id: 'q2', text: '你最喜欢的颜色是什么？' },
    { id: 'q3', text: '你的出生地是哪里？' },
    { id: 'q4', text: '你最好的朋友名字是什么？' },
  ]);
  const [ledgerAction, setLedgerAction] = useState<null | { txId: string; mode: 'approve' | 'reject' }>(null);
  const [ledgerReason, setLedgerReason] = useState('');

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

  useEffect(() => {
    if (!userEditId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(buildApiUrl('/api/auth/security-question-presets'));
        const j = (await res.json()) as { success?: boolean; list?: SecurityPresetRow[] };
        if (!cancelled && j.success && Array.isArray(j.list) && j.list.length) {
          setSecPresets(j.list);
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEditId]);

  async function openUserEdit(id: string) {
    setUserEditId(id);
    setUserEditDetail(null);
    setUserEditForm(null);
    try {
      const r = await adminFetch<{ success: boolean; data: AdminUserDetail }>(
        `/api/admin/users/${encodeURIComponent(id)}/detail`,
      );
      const d = r.data;
      setUserEditDetail(d);
      const sq = d.securityQuestions || [];
      setUserEditForm({
        nickname: d.nickname,
        displayId8: d.displayId8,
        customerNo: String(d.customerNo ?? '').trim(),
        parentId: d.parentId ?? '',
        agentStatus: d.agentStatus === 'disabled' ? 'disabled' : 'active',
        balanceMode: 'none',
        balanceValue: '',
        newLoginPassword: '',
        newLoginPasswordConfirm: '',
        newTradePassword: '',
        sec1Q: sq[0]?.questionId || 'q1',
        sec1A: '',
        sec2Q: sq[1]?.questionId || 'q2',
        sec2A: '',
        inviteCodeDisplay: String(d.inviteCodeDisplay ?? ''),
        reason: '',
      });
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : '加载用户失败');
      setUserEditId(null);
    }
  }

  function closeUserEdit() {
    setUserEditId(null);
    setUserEditDetail(null);
    setUserEditForm(null);
  }

  async function saveUserEdit() {
    if (!userEditId || !userEditForm || !userEditDetail) return;
    const f = userEditForm;
    if (f.reason.trim().length < 2) {
      window.alert('操作原因至少 2 个字');
      return;
    }
    const body: Record<string, unknown> = {
      reason: f.reason.trim(),
      nickname: f.nickname.trim(),
      displayId8: f.displayId8.trim(),
      parentId: f.parentId.trim() || null,
      agentStatus: f.agentStatus,
    };
    if (f.customerNo.trim()) {
      const n = Number(f.customerNo.trim());
      if (!Number.isFinite(n) || n < 1) {
        window.alert('客户号须为正整数或留空表示不修改');
        return;
      }
      body.customerNo = n;
    } else {
      body.customerNo = '';
    }

    if (f.balanceMode === 'delta') {
      const d = Number(f.balanceValue);
      if (!Number.isFinite(d) || d === 0) {
        window.alert('上分/下分金额须为非 0 数字');
        return;
      }
      body.balanceDelta = d;
    } else if (f.balanceMode === 'set') {
      const s = Number(f.balanceValue);
      if (!Number.isFinite(s) || s < 0) {
        window.alert('设定余额须为不小于 0 的数字');
        return;
      }
      body.balanceSet = s;
    }

    if (f.newLoginPassword || f.newLoginPasswordConfirm) {
      body.newLoginPassword = f.newLoginPassword;
      body.newLoginPasswordConfirm = f.newLoginPasswordConfirm;
    }
    if (f.newTradePassword.trim()) {
      body.newTradePassword = f.newTradePassword.trim();
    }
    if (f.sec1A.trim() && f.sec2A.trim()) {
      body.security = [
        { questionId: f.sec1Q, answer: f.sec1A.trim() },
        { questionId: f.sec2Q, answer: f.sec2A.trim() },
      ];
    } else if (f.sec1A.trim() || f.sec2A.trim()) {
      window.alert('修改密保需同时填写两条答案');
      return;
    }
    const invTrim = f.inviteCodeDisplay.trim().toUpperCase();
    const origInv = String(userEditDetail.inviteCodeDisplay ?? '')
      .trim()
      .toUpperCase();
    if (invTrim && invTrim !== origInv) {
      body.inviteCodeDisplay = invTrim;
    }

    setUserEditSaving(true);
    try {
      await adminFetch(`/api/admin/users/${encodeURIComponent(userEditId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      window.alert('已保存');
      closeUserEdit();
      void loadUsers(userListQ);
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : '保存失败');
    } finally {
      setUserEditSaving(false);
    }
  }

  async function submitLedgerAudit() {
    if (!ledgerAction) return;
    if (ledgerReason.trim().length < 2) {
      window.alert('原因至少 2 个字');
      return;
    }
    const status = ledgerAction.mode === 'approve' ? '成功' : '已驳回';
    try {
      await adminFetch(`/api/admin/finance/ledger/${encodeURIComponent(ledgerAction.txId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: ledgerReason.trim() }),
      });
      window.alert(ledgerAction.mode === 'approve' ? '已通过' : '已驳回并退回余额');
      setLedgerAction(null);
      setLedgerReason('');
      void loadFinanceLedger();
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : '操作失败');
    }
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
                      <th>操作</th>
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
                        <td>
                          <button type="button" className="dh-admin-btn dh-admin-btn--ghost" onClick={() => void openUserEdit(u.id)}>
                            编辑
                          </button>
                        </td>
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
                        <th>操作</th>
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
                          <td>
                            {r.ledgerType === 'withdraw' && r.status === '处理中' ? (
                              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <button
                                  type="button"
                                  className="dh-admin-btn dh-admin-btn--primary"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => {
                                    setLedgerReason('');
                                    setLedgerAction({ txId: r.id, mode: 'approve' });
                                  }}
                                >
                                  通过
                                </button>
                                <button
                                  type="button"
                                  className="dh-admin-btn dh-admin-btn--outline"
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => {
                                    setLedgerReason('');
                                    setLedgerAction({ txId: r.id, mode: 'reject' });
                                  }}
                                >
                                  驳回
                                </button>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
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

          {userEditId ? (
            <div
              className="dh-admin-modal-backdrop"
              onClick={() => {
                if (!userEditSaving) closeUserEdit();
              }}
              role="presentation"
            >
              <div
                className="dh-admin-modal"
                style={{ maxWidth: 560, maxHeight: '92vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ marginTop: 0 }}>编辑用户</h3>
                {!userEditForm || !userEditDetail ? (
                  <p className="dh-admin-text-muted">加载中…</p>
                ) : (
                  <>
                    <p className="dh-admin-text-muted" style={{ marginBottom: 12 }}>
                      <code>{userEditDetail.id}</code> · 当前余额 ¥{userEditDetail.balance.toFixed(2)} · IP {userEditDetail.lastIp || '—'}
                    </p>
                    <label className="dh-admin-label">
                      用户名
                      <input
                        className="dh-admin-input"
                        value={userEditForm.nickname}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, nickname: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      展示 ID（8 位数字，可空）
                      <input
                        className="dh-admin-input"
                        value={userEditForm.displayId8}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, displayId8: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      客户号（正整数，留空表示不修改）
                      <input
                        className="dh-admin-input"
                        value={userEditForm.customerNo}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, customerNo: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      上级用户 ID（留空为无上级）
                      <input
                        className="dh-admin-input"
                        value={userEditForm.parentId}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, parentId: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      账号状态
                      <select
                        className="dh-admin-input"
                        value={userEditForm.agentStatus}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, agentStatus: e.target.value } : p))}
                      >
                        <option value="active">正常</option>
                        <option value="disabled">已禁用</option>
                      </select>
                    </label>
                    <label className="dh-admin-label">
                      余额调整
                      <select
                        className="dh-admin-input"
                        value={userEditForm.balanceMode}
                        onChange={(e) =>
                          setUserEditForm((p) =>
                            p ? { ...p, balanceMode: e.target.value as UserEditFormState['balanceMode'] } : p,
                          )
                        }
                      >
                        <option value="none">不调整</option>
                        <option value="delta">上分 / 下分（正数上分，负数下分）</option>
                        <option value="set">直接设定余额</option>
                      </select>
                    </label>
                    {userEditForm.balanceMode !== 'none' ? (
                      <label className="dh-admin-label">
                        {userEditForm.balanceMode === 'delta' ? '变动金额' : '目标余额'}
                        <input
                          className="dh-admin-input"
                          type="number"
                          step="0.01"
                          value={userEditForm.balanceValue}
                          onChange={(e) => setUserEditForm((p) => (p ? { ...p, balanceValue: e.target.value } : p))}
                        />
                      </label>
                    ) : null}
                    <label className="dh-admin-label">
                      新登录密码（留空不改，改则至少 6 位）
                      <input
                        className="dh-admin-input"
                        type="password"
                        autoComplete="new-password"
                        value={userEditForm.newLoginPassword}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, newLoginPassword: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      确认新登录密码
                      <input
                        className="dh-admin-input"
                        type="password"
                        autoComplete="new-password"
                        value={userEditForm.newLoginPasswordConfirm}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, newLoginPasswordConfirm: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      新交易密码（6 位数字，留空不改）
                      <input
                        className="dh-admin-input"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={userEditForm.newTradePassword}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, newTradePassword: e.target.value } : p))}
                      />
                    </label>
                    <p className="dh-admin-text-muted" style={{ fontSize: 13 }}>
                      密保：填写两条答案即重置密保；不填则不改。已设：登录密码 {userEditDetail.hasLoginPassword ? '是' : '否'} · 交易密码{' '}
                      {userEditDetail.hasTradePassword ? '是' : '否'}
                    </p>
                    <label className="dh-admin-label">
                      密保问题 1
                      <select
                        className="dh-admin-input"
                        value={userEditForm.sec1Q}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, sec1Q: e.target.value } : p))}
                      >
                        {secPresets.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.text}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dh-admin-label">
                      答案 1
                      <input
                        className="dh-admin-input"
                        value={userEditForm.sec1A}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, sec1A: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      密保问题 2
                      <select
                        className="dh-admin-input"
                        value={userEditForm.sec2Q}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, sec2Q: e.target.value } : p))}
                      >
                        {secPresets.map((pr) => (
                          <option key={`${pr.id}-2`} value={pr.id}>
                            {pr.text}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dh-admin-label">
                      答案 2
                      <input
                        className="dh-admin-input"
                        value={userEditForm.sec2A}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, sec2A: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      邀请码展示（修改为新码须不与全站冲突；留空或不变可不填）
                      <input
                        className="dh-admin-input"
                        value={userEditForm.inviteCodeDisplay}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, inviteCodeDisplay: e.target.value } : p))}
                      />
                    </label>
                    <label className="dh-admin-label">
                      操作原因（必填，写入账本）
                      <input
                        className="dh-admin-input"
                        value={userEditForm.reason}
                        onChange={(e) => setUserEditForm((p) => (p ? { ...p, reason: e.target.value } : p))}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        className="dh-admin-btn dh-admin-btn--primary"
                        disabled={userEditSaving}
                        onClick={() => void saveUserEdit()}
                      >
                        {userEditSaving ? '保存中…' : '保存'}
                      </button>
                      <button type="button" className="dh-admin-btn dh-admin-btn--ghost" disabled={userEditSaving} onClick={closeUserEdit}>
                        取消
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {ledgerAction ? (
            <div
              className="dh-admin-modal-backdrop"
              onClick={() => setLedgerAction(null)}
              role="presentation"
            >
              <div className="dh-admin-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>{ledgerAction.mode === 'approve' ? '通过提现' : '驳回提现'}</h3>
                <p className="dh-admin-text-muted">流水 ID：{ledgerAction.txId}</p>
                <label className="dh-admin-label">
                  原因（至少 2 字）
                  <input
                    className="dh-admin-input"
                    value={ledgerReason}
                    onChange={(e) => setLedgerReason(e.target.value)}
                  />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" className="dh-admin-btn dh-admin-btn--primary" onClick={() => void submitLedgerAudit()}>
                    确认
                  </button>
                  <button type="button" className="dh-admin-btn dh-admin-btn--ghost" onClick={() => setLedgerAction(null)}>
                    取消
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
type SupportSessionRow = {
  id: string;
  userId: string;
  userNickname: string;
  status: string;
  updatedAt: string;
  adminUnread: number;
  lastPreview: string;
  lastRole: string;
};

type SupportMsgRow = { id: string; role: string; text: string; createdAt: string };

export function AdminSupportPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SupportSessionRow[]>([]);
  const [sessErr, setSessErr] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<SupportMsgRow[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const r = await adminFetch<{ success: boolean; list: SupportSessionRow[] }>('/api/admin/support/sessions');
      setSessions(Array.isArray(r.list) ? r.list : []);
      setSessErr(null);
    } catch (e: unknown) {
      setSessErr(e instanceof Error ? e.message : '加载失败');
    }
  }, []);

  const loadMsgsFull = useCallback(async (sid: string) => {
    const r = await adminFetch<{ success: boolean; messages: SupportMsgRow[] }>(
      `/api/admin/support/sessions/${encodeURIComponent(sid)}/messages`,
    );
    if (r.success && Array.isArray(r.messages)) {
      setMsgs(r.messages);
      lastIdRef.current = r.messages.length ? r.messages[r.messages.length - 1].id : '';
    }
  }, []);

  const pollAfter = useCallback(async () => {
    if (!selId || !lastIdRef.current) return;
    const qs = `?after=${encodeURIComponent(lastIdRef.current)}`;
    const r = await adminFetch<{ success: boolean; messages: SupportMsgRow[] }>(
      `/api/admin/support/sessions/${encodeURIComponent(selId)}/messages${qs}`,
    );
    if (r.success && Array.isArray(r.messages) && r.messages.length) {
      setMsgs((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const add = r.messages.filter((m) => !ids.has(m.id));
        if (!add.length) return prev;
        const merged = [...prev, ...add];
        lastIdRef.current = merged[merged.length - 1].id;
        return merged;
      });
    }
  }, [selId]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    void loadSessions();
    const id = window.setInterval(() => void loadSessions(), 8000);
    return () => clearInterval(id);
  }, [navigate, loadSessions]);

  useEffect(() => {
    if (!selId) {
      setMsgs([]);
      lastIdRef.current = '';
      return;
    }
    void loadMsgsFull(selId);
    const id = window.setInterval(() => void pollAfter(), 2800);
    return () => clearInterval(id);
  }, [selId, loadMsgsFull, pollAfter]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs, selId]);

  async function sendReply() {
    if (!selId || !input.trim()) return;
    setSending(true);
    try {
      await adminFetch(`/api/admin/support/sessions/${encodeURIComponent(selId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: input.trim() }),
      });
      setInput('');
      const r = await adminFetch<{ success: boolean; messages: SupportMsgRow[] }>(
        `/api/admin/support/sessions/${encodeURIComponent(selId)}/messages`,
      );
      if (r.success && Array.isArray(r.messages)) {
        setMsgs(r.messages);
        lastIdRef.current = r.messages.length ? r.messages[r.messages.length - 1].id : '';
      }
      void loadSessions();
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSending(false);
    }
  }

  async function setSessionStatus(st: 'open' | 'closed') {
    if (!selId) return;
    try {
      await adminFetch(`/api/admin/support/sessions/${encodeURIComponent(selId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: st }),
      });
      void loadSessions();
      void loadMsgsFull(selId);
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : '更新失败');
    }
  }

  const active = sessions.find((s) => s.id === selId);

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
          {sessErr ? <p className="dh-admin-error">{sessErr}</p> : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(0, 2fr)', gap: 16, alignItems: 'stretch' }}>
            <div className="dh-admin-card" style={{ minHeight: 420 }}>
              <h2 className="dh-admin-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare className="dh-admin-biz-icon" size={18} strokeWidth={1.5} />
                会话
              </h2>
              <button type="button" className="dh-admin-btn dh-admin-btn--ghost" style={{ marginBottom: 10 }} onClick={() => void loadSessions()}>
                刷新列表
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflow: 'auto' }}>
                {sessions.length === 0 ? (
                  <p className="dh-admin-text-muted">暂无会话（用户打开前台客服后会自动出现）</p>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelId(s.id)}
                      className="dh-admin-card"
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '0.75rem 1rem',
                        border: selId === s.id ? '2px solid var(--dh-admin-accent, #3b82f6)' : undefined,
                        background: selId === s.id ? 'rgba(59,130,246,0.06)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{s.userNickname || '用户'}</span>
                        {s.adminUnread > 0 ? (
                          <span
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              borderRadius: 999,
                              padding: '0 7px',
                              fontSize: 12,
                              lineHeight: '20px',
                            }}
                          >
                            {s.adminUnread}
                          </span>
                        ) : null}
                      </div>
                      <p className="dh-admin-text-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                        {s.lastPreview || '—'}
                      </p>
                      <p className="dh-admin-text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                        {s.status === 'closed' ? '已关闭' : '进行中'} · {new Date(s.updatedAt).toLocaleString('zh-CN')}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="dh-admin-card" style={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}>
              {!selId ? (
                <p className="dh-admin-text-muted" style={{ margin: 'auto', textAlign: 'center' }}>
                  请选择左侧会话
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <b>{active?.userNickname || '用户'}</b>
                    <code className="dh-admin-text-muted">{active?.userId}</code>
                    <span style={{ flex: 1 }} />
                    {active?.status === 'closed' ? (
                      <button type="button" className="dh-admin-btn dh-admin-btn--outline" onClick={() => void setSessionStatus('open')}>
                        重新打开
                      </button>
                    ) : (
                      <button type="button" className="dh-admin-btn dh-admin-btn--outline" onClick={() => void setSessionStatus('closed')}>
                        结束会话
                      </button>
                    )}
                  </div>
                  <div
                    ref={scrollRef}
                    style={{
                      flex: 1,
                      overflow: 'auto',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                      background: 'rgba(0,0,0,0.15)',
                    }}
                  >
                    {msgs.map((m) => {
                      const isAdmin = m.role === 'admin';
                      const isSys = m.role === 'system';
                      return (
                        <div
                          key={m.id}
                          style={{
                            marginBottom: 10,
                            display: 'flex',
                            justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '85%',
                              padding: '8px 12px',
                              borderRadius: 10,
                              fontSize: 14,
                              lineHeight: 1.45,
                              background: isSys
                                ? 'rgba(148,163,184,0.2)'
                                : isAdmin
                                  ? 'rgba(59,130,246,0.35)'
                                  : 'rgba(255,255,255,0.08)',
                            }}
                          >
                            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                              {isSys ? '系统' : isAdmin ? '客服' : '用户'} · {new Date(m.createdAt).toLocaleString('zh-CN')}
                            </div>
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="dh-admin-input"
                      style={{ flex: 1 }}
                      placeholder="输入回复…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void sendReply();
                        }
                      }}
                    />
                    <button type="button" className="dh-admin-btn dh-admin-btn--primary" disabled={sending} onClick={() => void sendReply()}>
                      {sending ? '发送中…' : '发送'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
