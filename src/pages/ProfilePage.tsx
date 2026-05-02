import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, FileBarChart2, Coins, UserRound } from 'lucide-react';
import { apiGet } from '../api/http';
import { getToken, logout } from '../lib/auth';
import { publicDisplayId8 } from '../lib/publicDisplayId';
import { PageHeader } from '../components/layout/PageHeader';
import { profileContent } from '../content/profile';

type MeSummary = {
  nameMask?: string;
  customerNo?: string;
  displayId8?: string;
  totalAsset?: number;
  userId?: string | number;
};

type FinanceRow = {
  id: string;
  time: string;
  type: string;
  amount: string;
  status: string;
  ledgerType?: string;
};

type BetOrderRow = {
  id: string;
  gameLabel: string;
  period: string;
  amount: number;
  status: string;
  payout: number | null;
  time: string;
  summary: string;
};

function todayInputYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const signedIn = !!getToken();

  const [user, setUser] = useState<MeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [finFrom, setFinFrom] = useState(todayInputYmd);
  const [finTo, setFinTo] = useState(todayInputYmd);
  const [finRows, setFinRows] = useState<FinanceRow[]>([]);
  const [finLoading, setFinLoading] = useState(false);
  const [finErr, setFinErr] = useState<string | null>(null);

  const [ordFrom, setOrdFrom] = useState(todayInputYmd);
  const [ordTo, setOrdTo] = useState(todayInputYmd);
  const [ordRows, setOrdRows] = useState<BetOrderRow[]>([]);
  const [ordLoading, setOrdLoading] = useState(false);
  const [ordErr, setOrdErr] = useState<string | null>(null);

  const fetchFinance = useCallback(async () => {
    if (!getToken()) return;
    setFinLoading(true);
    setFinErr(null);
    try {
      const qs = new URLSearchParams({
        from: finFrom,
        to: finTo,
        types: 'deposit,withdraw',
        limit: '500',
      });
      const res = await apiGet<{ success?: boolean; list?: FinanceRow[] }>(`/api/me/wallet-records?${qs}`);
      setFinRows(res.success && Array.isArray(res.list) ? res.list : []);
    } catch (e: unknown) {
      setFinErr(e instanceof Error ? e.message : profileContent.repErr);
      setFinRows([]);
    } finally {
      setFinLoading(false);
    }
  }, [finFrom, finTo]);

  const fetchOrders = useCallback(async () => {
    if (!getToken()) return;
    setOrdLoading(true);
    setOrdErr(null);
    try {
      const qs = new URLSearchParams({
        from: ordFrom,
        to: ordTo,
        limit: '500',
      });
      const res = await apiGet<{ success?: boolean; list?: BetOrderRow[] }>(`/api/me/bet-orders?${qs}`);
      setOrdRows(res.success && Array.isArray(res.list) ? res.list : []);
    } catch (e: unknown) {
      setOrdErr(e instanceof Error ? e.message : profileContent.repErr);
      setOrdRows([]);
    } finally {
      setOrdLoading(false);
    }
  }, [ordFrom, ordTo]);

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ success?: boolean; data?: MeSummary }>('/api/me/summary');
        if (!cancelled && data.success && data.data) {
          setUser(data.data);
        }
      } catch {
        /* 忽略 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    void fetchFinance();
    void fetchOrders();
    // 仅登录态变化时拉默认区间；改日期后由「查询」触发 fetchFinance / fetchOrders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  function handleLogout() {
    logout();
    setUser(null);
    navigate('/', { replace: true });
  }

  if (!signedIn) {
    return (
      <div className="dx-page">
        <PageHeader title={profileContent.pageTitle} backTo="/" />
        <main className="dx-page-main">
          <section className="dh-gate-card">
            <p className="dh-gate-title">{profileContent.gateTitle}</p>
            <p className="dh-gate-desc">{profileContent.gateDesc}</p>
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/')}>
              {profileContent.backHome}
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dx-page">
        <PageHeader title={profileContent.pageTitle} backTo="/" />
        <main className="dx-page-main">
          <p className="dx-loading-line">{profileContent.loading}</p>
        </main>
      </div>
    );
  }

  const seed =
    user?.userId != null && String(user.userId).trim() !== ''
      ? String(user.userId)
      : user?.customerNo != null && String(user.customerNo).trim() !== ''
        ? String(user.customerNo)
        : '';
  const displayId =
    user?.displayId8 != null && String(user.displayId8).trim() !== ''
      ? String(user.displayId8).trim()
      : seed
        ? publicDisplayId8(seed)
        : '—';
  const displayName = user?.nameMask ?? '用户';
  const balance = Number(user?.totalAsset ?? 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="dx-page">
      <PageHeader title={profileContent.pageTitle} backTo="/" />
      <main className="dx-page-main">
        <section className="dx-profile-card">
          <div className="dx-profile-hero">
            <div className="dx-profile-avatar" aria-hidden>
              <UserRound size={28} />
            </div>
            <div>
              <p className="dx-profile-id">{displayId}</p>
              <p className="dx-profile-name">{displayName}</p>
              <p className="dx-profile-balance-label">{profileContent.balanceLabel}</p>
              <p className="dx-profile-balance">¥{balance}</p>
            </div>
          </div>
        </section>

        <div className="dx-profile-cta-row">
          <Link to="/deposit" className="dx-cta dx-cta--gold">
            <ArrowDownToLine size={20} />
            {profileContent.recharge}
          </Link>
          <Link to="/withdraw" className="dx-cta dx-cta--outline">
            <ArrowUpFromLine size={20} />
            {profileContent.withdraw}
          </Link>
          <Link to="/wallet/records" className="dx-cta dx-cta--outline">
            <FileBarChart2 size={20} />
            {profileContent.fundRecords}
          </Link>
        </div>

        <section className="dx-rep-card">
          <h2 className="dx-rep-title">{profileContent.repFinanceTitle}</h2>
          <p className="dx-rep-hint">{profileContent.repFinanceHint}</p>
          <div className="dx-rep-toolbar">
            <label className="dx-rep-field">
              <span>{profileContent.repFrom}</span>
              <input type="date" value={finFrom} onChange={(e) => setFinFrom(e.target.value)} className="dx-rep-input" />
            </label>
            <label className="dx-rep-field">
              <span>{profileContent.repTo}</span>
              <input type="date" value={finTo} onChange={(e) => setFinTo(e.target.value)} className="dx-rep-input" />
            </label>
            <button type="button" className="dx-btn-primary dx-rep-query" onClick={() => void fetchFinance()}>
              {profileContent.repQuery}
            </button>
          </div>
          {finErr ? <p className="dx-rep-err">{finErr}</p> : null}
          <div className="dx-rep-table-wrap">
            <table className="dx-rep-table">
              <thead>
                <tr>
                  <th>{profileContent.repTableTime}</th>
                  <th>{profileContent.repTableType}</th>
                  <th>{profileContent.repTableAmount}</th>
                  <th>{profileContent.repTableStatus}</th>
                </tr>
              </thead>
              <tbody>
                {finLoading ? (
                  <tr>
                    <td colSpan={4} className="dx-rep-muted">
                      {profileContent.repLoading}
                    </td>
                  </tr>
                ) : finRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dx-rep-muted">
                      {profileContent.repEmpty}
                    </td>
                  </tr>
                ) : (
                  finRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.time}</td>
                      <td>{r.type}</td>
                      <td>{r.amount}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dx-rep-card">
          <h2 className="dx-rep-title">{profileContent.repOrdersTitle}</h2>
          <p className="dx-rep-hint">{profileContent.repOrdersHint}</p>
          <div className="dx-rep-toolbar">
            <label className="dx-rep-field">
              <span>{profileContent.repFrom}</span>
              <input type="date" value={ordFrom} onChange={(e) => setOrdFrom(e.target.value)} className="dx-rep-input" />
            </label>
            <label className="dx-rep-field">
              <span>{profileContent.repTo}</span>
              <input type="date" value={ordTo} onChange={(e) => setOrdTo(e.target.value)} className="dx-rep-input" />
            </label>
            <button type="button" className="dx-btn-primary dx-rep-query" onClick={() => void fetchOrders()}>
              {profileContent.repQuery}
            </button>
          </div>
          {ordErr ? <p className="dx-rep-err">{ordErr}</p> : null}
          <div className="dx-rep-table-wrap">
            <table className="dx-rep-table">
              <thead>
                <tr>
                  <th>{profileContent.repTableTime}</th>
                  <th>{profileContent.repTableGame}</th>
                  <th>{profileContent.repTablePeriod}</th>
                  <th>{profileContent.repTableStake}</th>
                  <th>{profileContent.repTablePayout}</th>
                  <th>{profileContent.repTableStatus}</th>
                  <th>{profileContent.repTableDetail}</th>
                </tr>
              </thead>
              <tbody>
                {ordLoading ? (
                  <tr>
                    <td colSpan={7} className="dx-rep-muted">
                      {profileContent.repLoading}
                    </td>
                  </tr>
                ) : ordRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dx-rep-muted">
                      {profileContent.repEmpty}
                    </td>
                  </tr>
                ) : (
                  ordRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.time}</td>
                      <td>{r.gameLabel}</td>
                      <td>{r.period}</td>
                      <td>¥{Number(r.amount).toFixed(2)}</td>
                      <td>{r.payout != null ? `¥${Number(r.payout).toFixed(2)}` : '—'}</td>
                      <td>{r.status}</td>
                      <td className="dx-rep-summary">{r.summary}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dx-menu-block">
          <p className="dx-menu-eyebrow">{profileContent.menuEyebrow}</p>
          <Link to="/agent" className="dx-menu-row">
            <Coins size={20} />
            <span>{profileContent.agentCenter}</span>
            <span className="dx-menu-arrow">›</span>
          </Link>
        </section>

        <button type="button" className="dx-btn-logout" onClick={handleLogout}>
          {profileContent.logout}
        </button>
      </main>
    </div>
  );
};

export default ProfilePage;
