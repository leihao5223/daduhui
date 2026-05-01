import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Game {
  id: string;
  name: string;
  image: string;
  tag: string;
}

interface GameCardProps {
  game: Game;
  /** 点击「开始」进入的游戏路径；不传则仅展示 */
  playPath?: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, playPath }) => {
  const navigate = useNavigate();

  function goPlay() {
    if (playPath) navigate(playPath);
  }

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    goPlay();
  }

  function handleCardClick() {
    goPlay();
  }

  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (!playPath) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goPlay();
    }
  }

  return (
    <motion.div
      className={`game-card${playPath ? ' game-card--nav' : ''}`}
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={playPath ? 'button' : undefined}
      tabIndex={playPath ? 0 : undefined}
      aria-label={playPath ? `进入${game.name}游戏大厅` : undefined}
    >
      <div className="game-image-wrapper">
        <img
          src={game.image}
          alt={game.name}
          className="game-image"
          decoding="async"
          loading="lazy"
        />
        {game.tag && (
          <span className={`game-tag ${game.tag.toLowerCase()}`}>{game.tag}</span>
        )}
        <div className="game-overlay">
          <motion.button
            type="button"
            className="play-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlay}
            disabled={!playPath}
            aria-label={playPath ? `进入${game.name}` : '敬请期待'}
          >
            <i className="fas fa-play"></i>
          </motion.button>
        </div>
      </div>
      <div className="game-info">
        <h4 className="game-name">{game.name}</h4>
      </div>
    </motion.div>
  );
};

export default GameCard;
