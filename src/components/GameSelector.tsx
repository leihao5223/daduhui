import React from 'react';
import { motion } from 'framer-motion';

const logoUrl = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-04-30/1777550396573-image.png?auth_key=9b76b96a40c7b392fc30d0ef304ed43f39f05414009ad3e74e6eb35e951d912c';

interface GameType {
  id: string;
  name: string;
  image: string;
  hot?: boolean;
}

const games: GameType[] = [
  { id: 'hongkong', name: '香港六合彩', image: logoUrl, hot: true },
  { id: 'jingsu', name: '竞速秒秒彩', image: logoUrl, hot: false },
  { id: 'xingyun', name: '幸运分分彩', image: logoUrl, hot: false },
  { id: 'henei', name: '河内五分彩', image: logoUrl, hot: false },
];

interface GameSelectorProps {
  selectedGame: string;
  onSelectGame: (gameId: string) => void;
}

export default function GameSelector({ selectedGame, onSelectGame }: GameSelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className="grid grid-cols-4 gap-3">
        {games.map((game, idx) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectGame(game.id)}
            className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${
              selectedGame === game.id
                ? 'bg-primary-50 border-primary-500 shadow-md'
                : 'bg-white border-slate-200 hover:border-primary-300'
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
              <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <span className={`text-xs font-medium text-center leading-tight ${
              selectedGame === game.id ? 'text-primary-700' : 'text-slate-700'
            }`}>
              {game.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
