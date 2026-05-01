import React from 'react';
import GameCard from './GameCard';
import { platformGameCategories } from '../config/platformGameCatalog';
import { homeContent } from '../content/home';

const GameCategory: React.FC = () => {
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
              <GameCard key={game.id} game={game} playPath={game.hallPath} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
};

export default GameCategory;
