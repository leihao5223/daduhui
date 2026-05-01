import React from 'react';
import GameCard from './GameCard';
import { platformGameCategories } from '../config/platformGameCatalog';

const GameCategory: React.FC = () => {
  return (
    <section className="game-category" aria-label="游戏分区">
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
              查看全部 <i className="fas fa-chevron-right"></i>
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
