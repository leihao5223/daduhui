import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, Sparkles, UserRound } from 'lucide-react';

const tabs = [
  { to: '/', label: '主页', Icon: Home, end: true as const },
  { to: '/deposit', label: '充值', Icon: Wallet, end: false as const },
  { to: '/activity', label: '活动', Icon: Sparkles, end: false as const },
  { to: '/profile', label: '个人中心', Icon: UserRound, end: false as const },
];

const BottomTabBar: React.FC = () => {
  return (
    <nav className="bottom-tab-bar" aria-label="底部主导航">
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-tab-item${isActive ? ' bottom-tab-item--active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className="bottom-tab-icon"
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden
              />
              <span className="bottom-tab-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomTabBar;
