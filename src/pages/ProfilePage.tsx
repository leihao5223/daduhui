import React, { useEffect, useState } from 'react';
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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const signedIn = !!getToken();

  const [user, setUser] = useState<MeSummary | null>(null);
  const [loading, setLoading] = useState(true);

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
