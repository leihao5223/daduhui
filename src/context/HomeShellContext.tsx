import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HomeShellContextValue = {
  openSportsUpdating: () => void;
};

const HomeShellContext = createContext<HomeShellContextValue | null>(null);

export const HomeShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sportsOpen, setSportsOpen] = useState(false);
  const openSportsUpdating = useCallback(() => setSportsOpen(true), []);
  const closeSports = useCallback(() => setSportsOpen(false), []);

  const value = useMemo(() => ({ openSportsUpdating }), [openSportsUpdating]);

  return (
    <HomeShellContext.Provider value={value}>
      {children}
      {sportsOpen ? (
        <div
          className="dx-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sports-updating-title"
          onClick={closeSports}
        >
          <div className="dx-modal" onClick={(e) => e.stopPropagation()}>
            <p id="sports-updating-title" className="dx-modal-title" style={{ marginBottom: 14 }}>
              正在更新中，敬请期待
            </p>
            <div className="dx-modal-actions" style={{ justifyContent: 'stretch' }}>
              <button type="button" className="dx-btn-primary" style={{ width: '100%' }} onClick={closeSports}>
                知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </HomeShellContext.Provider>
  );
};

export function useHomeShell(): HomeShellContextValue {
  const ctx = useContext(HomeShellContext);
  if (!ctx) {
    throw new Error('useHomeShell must be used within HomeShellProvider');
  }
  return ctx;
}
