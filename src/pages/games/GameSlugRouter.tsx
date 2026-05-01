import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findPlatformGameByHallPath } from '../../config/platformGameCatalog';
import GameHallPage from './GameHallPage';
import HkMarkSixGamePage from './HkMarkSixGamePage';

const GameSlugRouter: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) {
    return <Navigate to="/" replace />;
  }

  if (slug === 'hk-marksix') {
    return <HkMarkSixGamePage />;
  }

  const path = `/game/${slug}`;
  const game = findPlatformGameByHallPath(path);
  if (!game) {
    return <Navigate to="/" replace />;
  }

  return <GameHallPage game={game} />;
};

export default GameSlugRouter;
