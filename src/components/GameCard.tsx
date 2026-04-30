import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface GameCardProps {
  id: string;
  name: string;
  icon: string;
  nextDraw: string;
  onClick: () => void;
}

export default function GameCard({ name, icon, nextDraw, onClick }: GameCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-gray-900 font-bold text-base">{name}</h3>
          <div className="flex items-center gap-1 text-blue-500 text-xs mt-1">
            <Clock className="w-3 h-3" />
            <span>{nextDraw}开奖</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.button>
  );
}
