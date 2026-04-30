import React from 'react';

interface NumberBallProps {
  value: string;
  zodiac: string;
  color: 'red' | 'blue' | 'green';
  isSpecial?: boolean;
}

const colorStyles = {
  red: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/50',
  blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-blue-500/50',
  green: 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 shadow-green-500/50'
};

function NumberBall({ value, zodiac, color, isSpecial }: NumberBallProps) {
  return (
    <div className={`relative flex flex-col items-center ${isSpecial ? 'ml-2' : ''}`}>
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${colorStyles[color]}
          shadow-lg shadow-inner
          border-2 border-white/20
          transform transition-transform hover:scale-110
          ${isSpecial ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}
        `}
        style={{
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)`
        }}
      >
        <span className="text-white font-bold text-sm">{value}</span>
      </div>
      <span className="text-xs text-gray-400 mt-1">{zodiac}</span>
    </div>
  );
}

interface LotteryResultProps {
  period: string;
  date: string;
  numbers: Array<{ value: string; zodiac: string; color: 'red' | 'blue' | 'green' }>;
  specialNumber: { value: string; zodiac: string; color: 'red' | 'blue' | 'green' };
}

export default function LotteryResult({ period, date, numbers, specialNumber }: LotteryResultProps) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-gray-400 text-sm">第{period}期</span>
          <span className="text-gray-500 text-xs ml-2">{date}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2">
        {numbers.map((num, idx) => (
          <NumberBall key={idx} {...num} />
        ))}
        <span className="text-yellow-500 text-xl mx-1">+</span>
        <NumberBall {...specialNumber} isSpecial />
      </div>
    </div>
  );
}
