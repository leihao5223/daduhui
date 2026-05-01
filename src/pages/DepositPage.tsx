import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/http';
import { getToken } from '../lib/auth';
import { useSupportChat } from '../context/SupportChatContext';
import { PageHeader } from '../components/layout/PageHeader';

type PayMethod = 'alipay' | 'wechat' | 'usdt';

const payMethodLabel: Record<PayMethod, string> = {
  alipay: '支付宝',
  wechat: '微信',
  usdt: 'USDT（赠送1%）',
};

const payMethodMessageLabel: Record<PayMethod, string> = {
  alipay: '支付宝',
  wechat: '微信',
  usdt: 'USDT',
};

const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { openChat, setPrefill, setAutoSend } = useSupportChat();
  const signedIn = !!getToken();
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('alipay');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickAmounts = [100, 1000, 5000];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!amount || Number(amount) <= 0) return;

    setSubmitting(true);

    try {
      const dep = await apiPost<{ success?: boolean; message?: string }>('/api/deposit/submit', {
        amount: Number(amount),
        payMethod,
      });
      if (!dep.success) {
        setErrorMsg(dep.message || '充值提交失败');
        return;
      }

      let userId = '****';
      try {
        const r = await apiGet<{ success?: boolean; data?: { userId?: string | number } }>('/api/me/summary');
        const rawId = String(r?.data?.userId ?? '').trim();
        if (rawId) userId = rawId;
      } catch {
        /* ignore */
      }

      const message = `id${userId}${payMethodMessageLabel[payMethod]}存款${Number(amount)}，请给我充值账户。`;
      setPrefill(message);
      setAutoSend(true);
      openChat();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '网络错误');
    } finally {
      setSubmitting(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="dx-page">
        <PageHeader title="充值" backTo="/" />
        <main className="dx-page-main">
          <section className="dh-gate-card">
            <p className="dh-gate-title">请先登录</p>
            <p className="dh-gate-desc">登录后方可演示即时到账充值并写入资金流水（`/api/deposit/submit`）。</p>
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/')}>
              返回首页
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dx-page">
      <PageHeader title="充值" backTo="/" />
      <main className="dx-page-main">
        <section className="dx-card">
          <p className="dx-card-label">支付方式</p>
          <div className="dx-pay-tabs" role="tablist">
            {(Object.keys(payMethodLabel) as PayMethod[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`dx-pay-tab ${payMethod === k ? 'dx-pay-tab--active' : ''}`}
                role="tab"
                aria-selected={payMethod === k}
                onClick={() => setPayMethod(k)}
              >
                {payMethodLabel[k]}
              </button>
            ))}
          </div>
        </section>

        <form className="dx-form" onSubmit={handleSubmit}>
          <label className="dx-field">
            <span className="dx-field-label">存款金额（元）</span>
            <input
              className="dx-input"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入存款金额"
              required
            />
          </label>

          <section className="dx-card">
            <p className="dx-card-label">快捷金额</p>
            <div className="dx-quick-row">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`dx-quick-btn ${amount === String(amt) ? 'dx-quick-btn--active' : ''}`}
                  onClick={() => setAmount(String(amt))}
                >
                  ¥{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </section>

          {errorMsg ? <p className="dx-hint" style={{ color: '#c62828' }}>{errorMsg}</p> : null}
          <button type="submit" className="dx-btn-primary" disabled={submitting}>
            {submitting ? '处理中…' : '确定存款'}
          </button>
          <p className="dx-hint">
            将先调用 `/api/deposit/submit` 演示即时入账并记流水，再打开客服会话发送充值留言。
          </p>
        </form>

        <section className="dx-deposit-history">
          <button type="button" className="dx-btn-ghost" onClick={() => navigate('/wallet/records')}>
            查看存款记录 →
          </button>
        </section>
      </main>
    </div>
  );
};

export default DepositPage;
