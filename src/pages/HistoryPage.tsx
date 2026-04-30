import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Calendar } from 'lucide-react';
import { supabase } from '../supabase/client';

interface HistoryPageProps {
  onBack: () => void;
  gameName: string;
}

interface LotteryResult {
  period: string;
  draw_date: string;
  numbers: number[];
  special_number: number;
}

const getColorClass = (num: number) => {
  const red = [1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46];
  const blue = [3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48];
  if (red.includes(num)) return 'bg-red-500';
  if (blue.includes(num)) return 'bg-blue-500';
  return 'bg-green-500';
};

export default function HistoryPage({ onBack, gameName }: HistoryPageProps) {
  const [searchPeriod, setSearchPeriod] = useState('');
  const [historyData, setHistoryData] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('lottery_results')
      .select('period, draw_date, numbers, special_number')
      .order('draw_date', { ascending: false })
      .limit(50);
    setHistoryData(data || []);
    setLoading(false);
  };

  const filteredData = searchPeriod 
    ? historyData.filter(item => item.period.includes(searchPeriod))
    : historyData;

  return (
    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen bg-[#f5f5f5] pt-14">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 fixed top-0 left-0 right-0 z-50">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <span className="text-gray-900 font-bold text-lg">{gameName}</span>
        <span className="text-gray-500 text-sm">开奖记录</span>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="输入期号搜索"
              value={searchPeriod}
              onChange={(e) => setSearchPeriod(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm"
            />
          </div>
          <button className="p-2.5 rounded-lg bg-white border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <div className="space-y-2">
            {filteredData.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-white rounded-lg p-3 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-bold text-sm">{item.period}期</span>
                  <span className="text-gray-500 text-xs">{item.draw_date}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.numbers.map((num, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${getColorClass(num)}`}>
                      {num.toString().padStart(2, '0')}
                    </div>
                  ))}
                  <span className="text-yellow-500 mx-0.5 font-bold">+</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-yellow-400 ${getColorClass(item.special_number)}`}>
                    {item.special_number.toString().padStart(2, '0')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
