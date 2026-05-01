import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DADUHUI_LOGO_URL } from '../branding';
import { useSupportChat } from '../context/SupportChatContext';
import { layoutContent } from '../content/layout';
import { STORAGE_KEYS } from '../config/constants';

function activePrimaryTab(pathname: string, tabs: typeof layoutContent.headerTabs): string {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  for (const t of tabs) {
    if (t.id === 'home' && (path === '/' || path === '')) return 'home';
    if (t.id !== 'home' && (path === t.path || path.startsWith(`${t.path}/`))) return t.id;
  }
  return '';
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openChat } = useSupportChat();
  const tabs = layoutContent.headerTabs;
  const primaryActive = activePrimaryTab(location.pathname, tabs);
  const agentActive = location.pathname.startsWith('/agent');

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo logo-brand">
          <img src={DADUHUI_LOGO_URL} alt={layoutContent.logoAlt} className="logo-image" />
          <span className="brand-name-glass">{layoutContent.brandName}</span>
        </div>
        <div className="header-actions">
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
