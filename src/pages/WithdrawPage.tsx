import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet, Banknote, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [bankCard, setBankCard] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');

  const balance = 8888.88;
  const quickAmounts = ['100', '500', '1000', '5000'];

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入提现金额');
      return;
    }
    if (parseFloat(amount) > balance) {
      alert('提现金额不能大于余额');
      return;
    }
    if (!bankCard || !bankName || !accountName) {
      alert('请完善银行卡信息');
      return;
    }
    alert(`已提交${amount}元提现申请，预计1-3个工作日到账`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">提现</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="text-blue-100">账户余额</span>
          </div>
          <div className="text-3xl font-bold">¥{balance.toFixed(2)}</div>
        </motion.div>

        {/* Amount Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="text-gray-500 text-sm mb-2 block">提现金额</label>
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <span className="text-2xl text-gray-900">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入金额"
              className="flex-1 text-2xl font-bold outline-none"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  amount === amt
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {amt}
              </button>
            ))}
            <button
              onClick={() => setAmount(balance.toString())}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700"
            >
              全部
            </button>
          </div>
        </div>

        {/* Bank Card Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-blue-600" />
            银行卡信息
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-500 text-sm block mb-1">开户银行</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="请输入开户银行"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm block mb-1">银行卡号</label>
              <input
                type="text"
                value={bankCard}
                onChange={(e) => setBankCard(e.target.value)}
                placeholder="请输入银行卡号"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm block mb-1">户名</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="请输入户名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">提现说明</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>单笔最低提现100元</li>
                <li>每日最多提现3次</li>
                <li>预计1-3个工作日到账</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg"
        >
          确认提现
        </button>
      </div>
    </div>
  );
}
