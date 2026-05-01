import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import type { PlatformGameEntry } from '../../config/platformGameCatalog';

const GameHallPage: React.FC<{ game: PlatformGameEntry }> = ({ game }) => {
  const navigate = useNavigate();

  return (
    <div className="dx-page game-hall-page">
      <PageHeader title={`${game.name} · 大厅`} backTo="/" />
      <main className="dx-page-main">
        <section className="dx-card">
          <p className="dx-hint">
            您已进入「{game.name}」游戏大厅。完整玩法与盘口接入中，可先体验已开放游戏。
          </p>
          <div className="game-hall-actions">
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/game/hk-marksix')}>
              前往香港六合彩
            </button>
            <button type="button" className="dx-btn-ghost" onClick={() => navigate(-1)}>
              返回上一页
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GameHallPage;
