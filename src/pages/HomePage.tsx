import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Banner from '../components/Banner';
import HomeMarquee from '../components/HomeMarquee';
import GameCategory from '../components/GameCategory';
import { STORAGE_KEYS } from '../config/constants';

const HomePage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const invite = q.get('invite');
    if (invite && invite.trim()) {
      try {
        sessionStorage.setItem(STORAGE_KEYS.pendingInvite, invite.trim());
      } catch {
        /* ignore */
      }
    }
  }, [location.search]);

  return (
    <>
      <Banner />
      <HomeMarquee />
      <GameCategory />
    </>
  );
};

export default HomePage;
