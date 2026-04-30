import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowDownCircle, ArrowUpCircle, Gift, Wallet } from 'lucide-react';

const transactions = [
  { id: 1, type: 'deposit', amount: 1000, status: 'success', time: '2026-05-02 14:30', desc: '银行卡充值' },
  { id: 2, type: 'withdraw', amount: 500, status: 'pending', time: '2026-05-01 16:20', desc: '提现到工商银行' },
  { id: 3, type: 'win', amount: 480, status: 'success', time: '2026-05-01 20:35', desc: '新澳门六合彩中奖' },
  { id: 4, type: 'rebate', amount: 28, status: 'success', time: '2026-04-30 00:00', desc: '代理返佣' },
  { id: 5, type: 'deposit', amount: 2000, status: 'success', time: '2026-04-28 10:15', desc: '支付宝充值' },
];

const filters = [
  { id: 'all', name: '全部' },
  { id: 'deposit', name: '充值' },
  { id: 'withdraw', name: '提现' },
  { id: 'win', name: '中奖' },
  { id: 'rebate', name: '返佣' },
];

const typeConfig: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  deposit: { icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-100', label: '充值' },
  withdraw: { icon: ArrowUpCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: '提现' },
  win: { icon: Gift, color: 'text-orange-600', bg: 'bg-orange-100', label: '中奖' },
  rebate: { icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100', label: '返佣' },
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTransactions = activeFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === activeFilter);

  const totalIn = filteredTransactions
    .filter(t => t.type === 'deposit' || t.type === 'win' || t.type === 'rebate')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOut = filteredTransactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">资金流水</h1>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-4">
        <div className="flex justify-around text-white">
          <div className="text-center">
            <p className="text-blue-100 text-sm">收入</p>
            <p className="text-xl font-bold text-green-300">+¥{totalIn}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm">支出</p>
            <p className="text-xl font-bold text-red-300">-¥{totalOut}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="p-4 space-y-3">
        {filteredTransactions.map((t, idx) => {
          const config = typeConfig[t.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">{config.label}</h3>
                  <span className={`font-bold ${t.type === 'withdraw' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'withdraw' ? '-' : '+'}¥{t.amount}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{t.desc}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-400 text-xs">{t.time}</span>
                  <span className={`text-xs ${
                    t.status === 'success' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {t.status === 'success' ? '已完成' : '处理中'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无资金流水</p>
          </div>
        )}
      </div>
    </div>
  );
}
