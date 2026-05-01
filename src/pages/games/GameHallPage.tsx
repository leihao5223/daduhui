import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import type { PlatformGameEntry } from '../../config/platformGameCatalog';
import { gamesContent } from '../../content/games';

const { hall } = gamesContent;

const GameHallPage: React.FC<{ game: PlatformGameEntry }> = ({ game }) => {
  const navigate = useNavigate();

  return (
    <div className="dx-page game-hall-page">
      <PageHeader title={`${game.name}${hall.titleSuffix}`} backTo="/" />
      <main className="dx-page-main">
        <section className="dx-card">
          <p className="dx-hint">
            {hall.intro(game.name)} {hall.detail}
          </p>
          <div className="game-hall-actions">
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/game/hk-marksix')}>
              {hall.goHk6}
            </button>
            <button type="button" className="dx-btn-ghost" onClick={() => navigate(-1)}>
              {hall.back}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GameHallPage;
