import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/http';
import { getToken } from '../lib/auth';
import { useSupportChat } from '../context/SupportChatContext';
import { PageHeader } from '../components/layout/PageHeader';
import { walletContent } from '../content/wallet';

type PayMethod = keyof typeof walletContent.deposit.payTabLabels;

const c = walletContent.deposit;

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
        setErrorMsg(dep.message || c.errorFallback);
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

      const msgLabel = c.payMessageLabels[payMethod];
      const message = `id${userId}${msgLabel}存款${Number(amount)}，请给我充值账户。`;
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
        <PageHeader title={c.pageTitle} backTo="/" />
        <main className="dx-page-main">
          <section className="dh-gate-card">
            <p className="dh-gate-title">{c.gateTitle}</p>
            <p className="dh-gate-desc">{c.gateDesc}</p>
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/')}>
              {c.backHome}
            </button>
          </section>
        </main>
      </div>
    );
  }

  const payKeys = Object.keys(c.payTabLabels) as PayMethod[];

  return (
    <div className="dx-page">
      <PageHeader title={c.pageTitle} backTo="/" />
      <main className="dx-page-main">
        <section className="dx-card">
          <p className="dx-card-label">{c.payLabel}</p>
          <div className="dx-pay-tabs" role="tablist">
            {payKeys.map((k) => (
              <button
                key={k}
                type="button"
                className={`dx-pay-tab ${payMethod === k ? 'dx-pay-tab--active' : ''}`}
                role="tab"
                aria-selected={payMethod === k}
                onClick={() => setPayMethod(k)}
              >
                {c.payTabLabels[k]}
              </button>
            ))}
          </div>
        </section>

        <form className="dx-form" onSubmit={handleSubmit}>
          <label className="dx-field">
            <span className="dx-field-label">{c.amountLabel}</span>
            <input
              className="dx-input"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={c.amountPlaceholder}
              required
            />
          </label>

          <section className="dx-card">
            <p className="dx-card-label">{c.quickLabel}</p>
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
            {submitting ? c.submitting : c.submit}
          </button>
          <p className="dx-hint">{c.hintAfterApi}</p>
        </form>

        <section className="dx-deposit-history">
          <button type="button" className="dx-btn-ghost" onClick={() => navigate('/wallet/records')}>
            {c.recordsLink}
          </button>
        </section>
      </main>
    </div>
  );
};

export default DepositPage;
