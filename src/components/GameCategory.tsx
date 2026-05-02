import React from 'react';
import GameCard from './GameCard';
import { platformGameCategories } from '../config/platformGameCatalog';
import { homeContent } from '../content/home';
import { useHomeShell } from '../context/HomeShellContext';

const GameCategory: React.FC = () => {
  const { openSportsUpdating } = useHomeShell();

  return (
    <section className="game-category" aria-label={homeContent.gameCategoryAriaLabel}>
      {platformGameCategories.map((category) => (
        <section
          key={category.id}
          className={`category-section ${category.sectionClass}`}
          aria-labelledby={`heading-${category.id}`}
        >
          <header className="category-head">
            <h2 className="category-head-title" id={`heading-${category.id}`}>
              {category.title}
            </h2>
            <button type="button" className="view-all">
              {homeContent.viewAll} <i className="fas fa-chevron-right"></i>
            </button>
          </header>
          <div className="games-list-full">
            {category.games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                playPath={category.id === 'sports-center' ? undefined : game.hallPath}
                onActivate={category.id === 'sports-center' ? () => openSportsUpdating() : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
};

export default GameCategory;
