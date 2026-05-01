import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DADUHUI_LOGO_URL } from '../branding';
import { useSupportChat } from '../context/SupportChatContext';

const PRIMARY_TAB_PATHS: Record<string, string> = {
  home: '/',
  recharge: '/deposit',
  sports: '/sports',
};

function activePrimaryTab(pathname: string): string {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/recharge') || path.startsWith('/deposit')) return 'recharge';
  if (path.startsWith('/sports')) return 'sports';
  return '';
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openChat } = useSupportChat();
  const primaryActive = activePrimaryTab(location.pathname);
  const agentActive = location.pathname.startsWith('/agent');

  const primaryTabs = [
    { id: 'home', label: '首页', icon: 'fa-home' },
    { id: 'recharge', label: '充值', icon: 'fa-wallet' },
    { id: 'sports', label: '体育', icon: 'fa-futbol' },
  ];

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo logo-brand">
          <img src={DADUHUI_LOGO_URL} alt="大都汇" className="logo-image" />
          <span className="brand-name-glass">大都汇</span>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-login" onClick={() => navigate('/login')}>
            登录
          </button>
          <button
            type="button"
            className="btn-register"
            onClick={() => {
              try {
                const inv = sessionStorage.getItem('daduhui_pending_invite');
                navigate(inv ? `/register?invite=${encodeURIComponent(inv)}` : '/register');
              } catch {
                navigate('/register');
              }
            }}
          >
            注册
          </button>
        </div>
      </div>
      <nav className="nav-tabs">
        <div className="tabs-container scrollbar-thin">
          {primaryTabs.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`tab-item ${primaryActive === tab.id ? 'active' : ''}`}
              onClick={() => navigate(PRIMARY_TAB_PATHS[tab.id] ?? '/')}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </motion.button>
          ))}

          {/* 体育与联系客服之间：仅此一格，仅代理中心 */}
          <div className="header-nav-slot header-nav-slot--agent" aria-label="代理入口">
            <motion.button
              type="button"
              className={`tab-item ${agentActive ? 'active' : ''}`}
              onClick={() => navigate('/agent')}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <i className="fas fa-sitemap" />
              <span>代理中心</span>
            </motion.button>
          </div>

          <button type="button" className="contact-btn" onClick={() => openChat()}>
            <i className="fas fa-headset"></i>
            <span>联系客服</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
