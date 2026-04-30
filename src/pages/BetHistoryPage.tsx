import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Filter, Calendar } from 'lucide-react';

const betRecords = [
  { id: 1, game: '新澳门六合彩', period: '2026046', type: '特码', number: '25', amount: 100, result: 'win', profit: 480, time: '2026-05-02 20:30' },
  { id: 2, game: '新澳门六合彩', period: '2026045', type: '生肖', number: '龙', amount: 50, result: 'lose', profit: -50, time: '2026-05-01 20:30' },
  { id: 3, game: '加拿大2.0', period: '2026044', type: '大小', number: '大', amount: 100, result: 'win', profit: 95, time: '2026-05-01 15:20' },
  { id: 4, game: '老澳门六合彩', period: '2026043', type: '波色', number: '红波', amount: 200, result: 'win', profit: 180, time: '2026-04-30 21:30' },
  { id: 5, game: '新澳门六合彩', period: '2026042', type: '特码', number: '12', amount: 100, result: 'lose', profit: -100, time: '2026-04-29 20:30' },
];

const filters = ['全部', '特码', '生肖', '波色', '大小', '单双'];

export default function BetHistoryPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filteredRecords = activeFilter === '全部'
    ? betRecords
    : betRecords.filter(r => r.type === activeFilter);

  const totalBet = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalProfit = filteredRecords.reduce((sum, r) => sum + r.profit, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">投注记录</h1>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-4">
        <div className="flex justify-around text-white">
          <div className="text-center">
            <p className="text-blue-100 text-sm">投注总额</p>
            <p className="text-xl font-bold">¥{totalBet}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm">盈亏</p>
            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {totalProfit >= 0 ? '+' : ''}¥{totalProfit}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <Calendar className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="p-4 space-y-3">
        {filteredRecords.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{record.game}</h3>
                <p className="text-gray-500 text-sm">第{record.period}期</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                record.result === 'win'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {record.result === 'win' ? '中奖' : '未中奖'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-4">
                <span className="text-gray-500">{record.type}</span>
                <span className="text-gray-900 font-medium">{record.number}</span>
              </div>
              <span className="text-gray-500">¥{record.amount}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-xs">{record.time}</span>
              <span className={`font-bold ${record.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {record.profit >= 0 ? '+' : ''}¥{record.profit}
              </span>
            </div>
          </motion.div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无投注记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
