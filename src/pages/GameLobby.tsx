import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ChevronUp, Clock, FileText, ArrowLeft, 
  Trophy, History, HelpCircle, Sparkles, User, Wallet 
} from 'lucide-react';
import { supabase } from '../supabase/client';
import LotteryResult from '../components/LotteryResult';
import CountdownTimer from '../components/CountdownTimer';
import BettingPanel from '../components/BettingPanel';
import HistoryPage from './HistoryPage';
import RulesModal from '../components/RulesModal';

const logoUrl = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-04-30/1777550396573-image.png?auth_key=9b76b96a40c7b392fc30d0ef304ed43f39f05414009ad3e74e6eb35e951d912c';

const zodiacMap = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
const getZodiac = (num: number) => zodiacMap[(num - 1) % 12];

const getColor = (num: number): 'red' | 'blue' | 'green' => {
  const red = [1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46];
  const blue = [3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48];
  if (red.includes(num)) return 'red';
  if (blue.includes(num)) return 'blue';
  return 'green';
};

const colorClass = {
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  green: 'bg-gradient-to-br from-green-500 to-green-600'
};

const games = [
  { id: 'hongkong', name: '香港六合彩', image: logoUrl },
  { id: 'jingsu', name: '竞速秒秒彩', image: logoUrl },
  { id: 'xingyun', name: '幸运分分彩', image: logoUrl },
  { id: 'henei', name: '河内五分彩', image: logoUrl },
];

export default function GameLobby() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState('hongkong');
  const [showRules, setShowRules] = useState(false);
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const [expandedResult, setExpandedResult] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState({ period: '2026045', date: '2026/04/25', time: '20:30:00' });
  const [lastResult, setLastResult] = useState<any>({
    period: '2026045',
    date: '2026/04/25',
    time: '20:30:00',
    numbers: [
      { value: '21', zodiac: '狗', color: 'green' },
      { value: '42', zodiac: '牛', color: 'blue' },
      { value: '46', zodiac: '鸡', color: 'red' },
      { value: '36', zodiac: '羊', color: 'blue' },
      { value: '04', zodiac: '兔', color: 'blue' },
      { value: '16', zodiac: '兔', color: 'green' },
    ],
    specialNumber: { value: '09', zodiac: '狗', color: 'blue' }
  });
  const [historyData, setHistoryData] = useState<any[]>([]);

  const currentGame = games.find(g => g.id === selectedGame);

  if (showHistoryPage) {
    return <HistoryPage onBack={() => setShowHistoryPage(false)} gameName={currentGame?.name || ''} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/home')} className="p-2 -ml-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src={logoUrl} alt="大都汇" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-900">大都汇</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                登录
              </button>
              <button className="px-4 py-1.5 border border-primary-600 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors">
                注册
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-4 space-y-4">
        {/* Game Selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-4 gap-3">
            {games.map((game, idx) => (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGame(game.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedGame === game.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-xs font-medium text-center ${
                  selectedGame === game.id ? 'text-primary-700' : 'text-slate-700'
                }`}>
                  {game.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Period Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img src={currentGame?.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{currentGame?.name}</h3>
                <p className="text-sm text-slate-500">第 {currentPeriod.period} 期</p>
                <p className="text-xs text-slate-400">{currentPeriod.date} {currentPeriod.time}</p>
              </div>
            </div>
          </div>

          {/* Last Result Display */}
          {lastResult && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">上期开奖</span>
                <span className="text-xs text-slate-500">{lastResult.period}期</span>
              </div>
              <div className="flex items-center gap-2">
                {lastResult.numbers.map((num: any, i: number) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${colorClass[num.color as keyof typeof colorClass]} flex items-center justify-center text-white text-xs font-bold`}>
                      {num.value}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">{num.zodiac}</span>
                  </div>
                ))}
                <span className="text-slate-400 mx-1">+</span>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${colorClass[lastResult.specialNumber.color as keyof typeof colorClass]} flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary-400`}>
                    {lastResult.specialNumber.value}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">{lastResult.specialNumber.zodiac}</span>
                </div>
                <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => setShowHistoryPage(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Clock className="w-3 h-3" />历史
                  </button>
                  <button 
                    onClick={() => setShowRules(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <FileText className="w-3 h-3" />规则
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Countdown */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">第2026046期</span>
              <span className="text-xs text-slate-400">2026/05/02 20:30:00</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">封盘倒计时</span>
                <span className="font-mono font-bold text-primary-600">48:57:53s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">开奖倒计时</span>
                <span className="font-mono font-bold text-red-600">49:07:53s</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Betting Panel */}
        <BettingPanel />
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
