import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, X } from 'lucide-react';
import { apiGet, apiPost } from '../api/http';
import { getToken } from '../lib/auth';
import { useSupportChat } from '../context/SupportChatContext';
import { PageHeader } from '../components/layout/PageHeader';
import { walletContent } from '../content/wallet';

const w = walletContent.withdraw;
type WithdrawMethodType = 'alipay' | 'wechat' | 'usdt';
type BoundWithdrawMethod = {
  id: string;
  type: WithdrawMethodType;
  label: string;
  detail: string;
};

const WITHDRAW_METHODS_STORAGE_KEY = 'daduhui_withdraw_bound_methods';
const WITHDRAW_SELECTED_STORAGE_KEY = 'daduhui_withdraw_selected_method_id';

const DEFAULT_BOUND_METHODS: BoundWithdrawMethod[] = [
  { id: 'w1', type: 'alipay', label: '支付宝', detail: 'a***@example.com' },
];

function isValidBoundMethod(x: unknown): x is BoundWithdrawMethod {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.detail === 'string' &&
    typeof o.label === 'string' &&
    (o.type === 'alipay' || o.type === 'wechat' || o.type === 'usdt')
  );
}

function loadWithdrawMethodsFromStorage(): { methods: BoundWithdrawMethod[]; selectedId: string } {
  try {
    const raw = localStorage.getItem(WITHDRAW_METHODS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const methods = parsed.filter(isValidBoundMethod);
        if (methods.length > 0) {
          let selectedId = localStorage.getItem(WITHDRAW_SELECTED_STORAGE_KEY)?.trim() ?? '';
          if (!selectedId || !methods.some((m) => m.id === selectedId)) {
            selectedId = methods[0].id;
          }
          return { methods, selectedId };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return { methods: DEFAULT_BOUND_METHODS, selectedId: DEFAULT_BOUND_METHODS[0].id };
}

function abbreviateWithdrawDetail(detail: string, type: WithdrawMethodType): string {
  const s = detail.trim();
  if (!s) return '';
  if (s.includes('***') || s.includes('…')) return s;

  if (type === 'alipay') {
    const at = s.indexOf('@');
    if (at > 0) {
      const local = s.slice(0, at);
      const domain = s.slice(at + 1);
      const head = local.slice(0, Math.min(1, local.length));
      return `${head}***@${domain}`;
    }
    if (/^\d{10,}$/.test(s)) {
      return `${s.slice(0, 3)}****${s.slice(-4)}`;
    }
  }

  if (type === 'usdt' || (type === 'wechat' && s.length >= 12)) {
    if (s.length <= 8) return s;
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }

  if (s.length <= 6) return s;
  return `${s.slice(0, 2)}…${s.slice(-2)}`;
}

const WithdrawPage: React.FC = () => {
  const navigate = useNavigate();
  const { openChat, setPrefill, setAutoSend } = useSupportChat();
  const signedIn = !!getToken();

  const init = loadWithdrawMethodsFromStorage();
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [boundMethods, setBoundMethods] = useState<BoundWithdrawMethod[]>(() => init.methods);
  const [selectedMethodId, setSelectedMethodId] = useState(() => init.selectedId);
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<WithdrawMethodType>('alipay');
  const [newMethodDetail, setNewMethodDetail] = useState('');

  const methodTypeLabel: Record<WithdrawMethodType, string> = {
    alipay: '支付宝',
    wechat: '微信',
    usdt: 'USDT（赠送1%）',
  };
  const methodMessageLabel: Record<WithdrawMethodType, string> = {
    alipay: '支付宝',
    wechat: '微信',
    usdt: 'USDT',
  };

  const selectedMethod = boundMethods.find((m) => m.id === selectedMethodId) ?? null;

  useEffect(() => {
    try {
      localStorage.setItem(WITHDRAW_METHODS_STORAGE_KEY, JSON.stringify(boundMethods));
    } catch {
      /* ignore */
    }
  }, [boundMethods]);

  useEffect(() => {
    try {
      localStorage.setItem(WITHDRAW_SELECTED_STORAGE_KEY, selectedMethodId);
    } catch {
      /* ignore */
    }
  }, [selectedMethodId]);

  function hintForMethod(t: WithdrawMethodType): string {
    if (t === 'alipay') return '请输入支付宝账号或上传收款码';
    if (t === 'wechat') return '请上传微信收款码';
    return '请输入 TRC20 地址';
  }

  function saveNewMethod() {
    const detail = newMethodDetail.trim();
    if (!detail) {
      setErrorMsg(hintForMethod(newMethodType));
      return;
    }
    const id = `w-${Date.now()}`;
    const next: BoundWithdrawMethod = {
      id,
      type: newMethodType,
      label: methodTypeLabel[newMethodType],
      detail,
    };
    setBoundMethods((prev) => [next, ...prev]);
    setSelectedMethodId(id);
    setMethodModalOpen(false);
    setNewMethodDetail('');
    setErrorMsg(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || Number(amount) <= 0) {
      setErrorMsg(w.amountError);
      return;
    }
    if (Number(amount) < 100) {
      setErrorMsg(w.minAmountError);
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(w.pwdError);
      return;
    }
    if (!selectedMethod) {
      setErrorMsg(w.methodError);
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiPost<{ success?: boolean; message?: string }>('/api/withdraw/request', {
        amount: Number(amount),
        tradePassword: password,
        withdrawMethod: selectedMethod.type,
        withdrawMethodDetail: selectedMethod.detail,
      });

      if (data.success) {
        let userId = '****';
        try {
          const r = await apiGet<{ success?: boolean; data?: { userId?: string | number } }>('/api/me/summary');
          const rawId = String(r?.data?.userId ?? '').trim();
          if (rawId) userId = rawId;
        } catch {
          /* keep default */
        }
        const message = `id${userId}提现${Number(amount)}到${methodMessageLabel[selectedMethod.type]}:${selectedMethod.detail}`;
        setPrefill(message);
        setAutoSend(true);
        openChat();
        navigate('/wallet/records');
      } else {
        setErrorMsg(data.message || w.requestFail);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '网络错误');
    } finally {
      setSubmitting(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="dx-page">
        <PageHeader title={w.pageTitle} backTo="/" />
        <main className="dx-page-main">
          <section className="dh-gate-card">
            <p className="dh-gate-title">{w.gateTitle}</p>
            <p className="dh-gate-desc">{w.gateDesc}</p>
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/')}>
              {w.backHome}
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dx-page">
      <PageHeader title={w.pageTitle} backTo="/profile" />
      <main className="dx-page-main">
        <section className="dx-card dx-withdraw-card">
          <p className="dx-card-label">取款方式</p>
          <div className="dx-withdraw-method-row">
            <span className="dx-withdraw-method-fixed-label">收款方式</span>
            <button
              type="button"
              className="dx-withdraw-trigger"
              aria-expanded={methodPickerOpen}
              aria-haspopup="dialog"
              onClick={() => {
                setMethodModalOpen(false);
                setMethodPickerOpen(true);
              }}
            >
              <span className="dx-withdraw-trigger-text">
                {selectedMethod
                  ? `${selectedMethod.label} · ${abbreviateWithdrawDetail(selectedMethod.detail, selectedMethod.type)}`
                  : '请选择收款方式'}
              </span>
              <ChevronDown size={16} className="dx-withdraw-trigger-chevron" aria-hidden />
            </button>
            <button
              type="button"
              className="dx-withdraw-add"
              aria-label="新增收款方式"
              onClick={() => {
                setMethodPickerOpen(false);
                setMethodModalOpen(true);
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </section>

        <form className="dx-form dx-withdraw-form" onSubmit={handleSubmit}>
          <label className="dx-field">
            <span className="dx-field-label">取款金额（元）</span>
            <input
              className="dx-input"
              type="number"
              min="100"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入取款金额"
              required
            />
          </label>

          <label className="dx-field">
            <span className="dx-field-label">交易密码</span>
            <input
              className="dx-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入6位交易密码"
              maxLength={6}
              autoComplete="new-password"
              required
            />
          </label>

          {errorMsg ? <p className="dx-withdraw-error">{errorMsg}</p> : null}

          <button type="submit" className="dx-btn-primary" disabled={submitting}>
            {submitting ? '提交中…' : '确认取款'}
          </button>
        </form>

        <section className="dx-withdraw-history">
          <button type="button" className="dx-btn-ghost" onClick={() => navigate('/wallet/records')}>
            查看取款记录 →
          </button>
        </section>
      </main>

      {methodPickerOpen ? (
        <div className="dx-withdraw-modal-bg" onClick={() => setMethodPickerOpen(false)} role="presentation">
          <div className="dx-withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dx-withdraw-modal-head">
              <p>选择收款方式</p>
              <button type="button" onClick={() => setMethodPickerOpen(false)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="dx-withdraw-modal-list">
              {boundMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`dx-withdraw-modal-option ${selectedMethodId === m.id ? 'dx-withdraw-modal-option--active' : ''}`}
                  onClick={() => {
                    setSelectedMethodId(m.id);
                    setMethodPickerOpen(false);
                  }}
                >
                  <span className="dx-withdraw-modal-option-label">{m.label}</span>
                  <span className="dx-withdraw-modal-option-detail">
                    {abbreviateWithdrawDetail(m.detail, m.type)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {methodModalOpen ? (
        <div className="dx-withdraw-modal-bg" onClick={() => setMethodModalOpen(false)} role="presentation">
          <div className="dx-withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dx-withdraw-modal-head">
              <p>新增收款方式</p>
              <button type="button" onClick={() => setMethodModalOpen(false)} aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="dx-withdraw-type-grid">
              {(['alipay', 'wechat', 'usdt'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`dx-withdraw-type-chip ${newMethodType === k ? 'dx-withdraw-type-chip--active' : ''}`}
                  onClick={() => setNewMethodType(k)}
                >
                  {methodTypeLabel[k]}
                </button>
              ))}
            </div>
            <label className="dx-field">
              <span className="dx-field-label">{hintForMethod(newMethodType)}</span>
              <input
                className="dx-input"
                type="text"
                value={newMethodDetail}
                onChange={(e) => setNewMethodDetail(e.target.value)}
                placeholder={hintForMethod(newMethodType)}
              />
            </label>
            <button type="button" className="dx-btn-primary" onClick={saveNewMethod}>
              保存收款方式
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WithdrawPage;
