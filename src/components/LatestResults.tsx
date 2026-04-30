import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface LotteryGame {
  id: string;
  name: string;
  period: string;
  numbers: number[];
  specialNumber: number;
  zodiacs: string[];
}

const games: LotteryGame[] = [
  { id: 'xinmacau', name: '新澳门六合彩', period: '2026046', numbers: [5, 12, 23, 34, 41, 8], specialNumber: 19, zodiacs: ['龙', '鸡', '兔', '虎', '蛇', '羊'] },
  { id: 'hongkong', name: '香港六合彩', period: '2026046', numbers: [7, 15, 24, 35, 42, 3], specialNumber: 18, zodiacs: ['马', '牛', '虎', '虎', '猴', '虎'] },
  { id: 'laomacau', name: '老澳门六合彩', period: '2026046', numbers: [2, 18, 29, 34, 46, 9], specialNumber: 21, zodiacs: ['龙', '猪', '猴', '虎', '狗', '猴'] },
];

const getColorClass = (num: number) => {
  const red = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
  const blue = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];
  if (red.includes(num)) return 'bg-red-500';
  if (blue.includes(num)) return 'bg-blue-500';
  return 'bg-green-500';
};

export default function LatestResults() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">最近开奖</h2>
        <button className="flex items-center text-sm text-blue-600 hover:text-blue-700">
          更多 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        {games.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">{game.name}</span>
              <span className="text-xs text-gray-500">{game.period}期</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {game.numbers.map((num, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full ${getColorClass(num)} flex items-center justify-center text-white text-xs font-bold`}>
                    {num.toString().padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-0.5">{game.zodiacs[i]}</span>
                </div>
              ))}
              <span className="text-yellow-500 mx-0.5 font-bold">+</span>
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full ${getColorClass(game.specialNumber)} flex items-center justify-center text-white text-xs font-bold ring-2 ring-yellow-400`}>
                  {game.specialNumber.toString().padStart(2, '0')}
                </div>
                <span className="text-[9px] text-gray-500 mt-0.5">特</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
