import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, Sparkles, UserRound } from 'lucide-react';
import { layoutContent } from '../content/layout';

const icons = [Home, Wallet, Sparkles, UserRound] as const;

const BottomTabBar: React.FC = () => {
  return (
    <nav className="bottom-tab-bar" aria-label="底部主导航">
      {layoutContent.bottomTabs.map(({ to, label, end }, i) => {
        const Icon = icons[i] ?? UserRound;
        return (
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
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
