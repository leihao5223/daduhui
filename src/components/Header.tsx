import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DADUHUI_LOGO_URL } from '../branding';
import { useSupportChat } from '../context/SupportChatContext';
import { layoutContent } from '../content/layout';
import { STORAGE_KEYS } from '../config/constants';
import { getToken, isAuthenticated, logout } from '../lib/auth';
import { publicDisplayId8 } from '../lib/publicDisplayId';
import { apiGet } from '../api/http';

function activePrimaryTab(pathname: string, tabs: typeof layoutContent.headerTabs): string {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  for (const t of tabs) {
    if (t.id === 'home' && (path === '/' || path === '')) return 'home';
    if (t.id !== 'home' && (path === t.path || path.startsWith(`${t.path}/`))) return t.id;
  }
  return '';
}

type MeSummaryData = {
  userId?: string;
  customerNo?: string;
  available?: number;
  totalAsset?: number;
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openChat } = useSupportChat();
  const tabs = layoutContent.headerTabs;
  const primaryActive = activePrimaryTab(location.pathname, tabs);
  const agentActive = location.pathname.startsWith('/agent');

  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [userStrip, setUserStrip] = useState<{ displayId: string; balance: number } | null>(null);

  useEffect(() => {
    function syncLogin() {
      setLoggedIn(isAuthenticated());
    }
    window.addEventListener('auth-changed', syncLogin);
    window.addEventListener('user-logout', syncLogin);
    return () => {
      window.removeEventListener('auth-changed', syncLogin);
      window.removeEventListener('user-logout', syncLogin);
    };
  }, []);

  const fetchUserStrip = useCallback(async () => {
    if (!getToken()) {
      setUserStrip(null);
      return;
    }
    try {
      const r = await apiGet<{ success?: boolean; data?: MeSummaryData }>('/api/me/summary');
      if (r.success && r.data) {
        const seed =
          r.data.userId != null && String(r.data.userId).trim() !== ''
            ? String(r.data.userId)
            : r.data.customerNo != null && String(r.data.customerNo).trim() !== ''
              ? String(r.data.customerNo)
              : '';
        if (!seed) {
          setUserStrip(null);
          return;
        }
        const bal =
          typeof r.data.available === 'number'
            ? r.data.available
            : typeof r.data.totalAsset === 'number'
              ? r.data.totalAsset
              : 0;
        setUserStrip({ displayId: publicDisplayId8(seed), balance: bal });
        return;
      }
      setUserStrip(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (/401|请先登录|Unauthorized/i.test(msg)) {
        logout();
        setUserStrip(null);
        return;
      }
      setUserStrip(null);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setUserStrip(null);
      return;
    }
    void fetchUserStrip();
  }, [loggedIn, fetchUserStrip]);

  useEffect(() => {
    function onFocus() {
      if (isAuthenticated()) void fetchUserStrip();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUserStrip]);

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo logo-brand">
          <img src={DADUHUI_LOGO_URL} alt={layoutContent.logoAlt} className="logo-image" />
          <span className="brand-name-glass">{layoutContent.brandName}</span>
        </div>
        <div className="header-actions">
          {loggedIn ? (
            <button
              type="button"
              className="header-user-strip"
              onClick={() => navigate('/profile')}
              aria-label="进入个人中心"
            >
              <span className="header-user-strip__id">
                {layoutContent.headerDisplayIdLabel} {userStrip?.displayId ?? '—'}
              </span>
              <span className="header-user-strip__balance">
                {layoutContent.headerBalance}{' '}
                {userStrip ? `¥${userStrip.balance.toFixed(2)}` : layoutContent.headerUserLoading}
              </span>
            </button>
          ) : (
            <>
              <button type="button" className="btn-login" onClick={() => navigate('/login')}>
                {layoutContent.login}
              </button>
              <button
                type="button"
                className="btn-register"
                onClick={() => {
                  try {
                    const inv = sessionStorage.getItem(STORAGE_KEYS.pendingInvite);
                    navigate(inv ? `/register?invite=${encodeURIComponent(inv)}` : '/register');
                  } catch {
                    navigate('/register');
                  }
                }}
              >
                {layoutContent.register}
              </button>
            </>
          )}
        </div>
      </div>
      <nav className="nav-tabs">
        <div className="tabs-container scrollbar-thin">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`tab-item ${primaryActive === tab.id ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </motion.button>
          ))}

          <div className="header-nav-slot header-nav-slot--agent" aria-label="代理入口">
            <motion.button
              type="button"
              className={`tab-item ${agentActive ? 'active' : ''}`}
              onClick={() => navigate('/agent')}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <i className="fas fa-sitemap" />
              <span>{layoutContent.agentCenter}</span>
            </motion.button>
          </div>

          <button type="button" className="contact-btn" onClick={() => openChat()}>
            <i className="fas fa-headset"></i>
            <span>{layoutContent.contactSupport}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
