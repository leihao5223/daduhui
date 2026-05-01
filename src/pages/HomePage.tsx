import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Banner from '../components/Banner';
import GameCategory from '../components/GameCategory';

const PENDING_INVITE_KEY = 'daduhui_pending_invite';

const HomePage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const invite = q.get('invite');
    if (invite && invite.trim()) {
      try {
        sessionStorage.setItem(PENDING_INVITE_KEY, invite.trim());
      } catch {
        /* ignore */
      }
    }
  }, [location.search]);

  return (
    <>
      <Banner />
      <GameCategory />
    </>
  );
};

export default HomePage;
