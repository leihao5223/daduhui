import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Wallet, QrCode, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const paymentMethods = [
  { id: 'bank', name: '银行卡转账', icon: CreditCard },
  { id: 'alipay', name: '支付宝', icon: QrCode },
  { id: 'wechat', name: '微信支付', icon: QrCode },
  { id: 'usdt', name: 'USDT', icon: Wallet },
];

export default function DepositPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [copied, setCopied] = useState(false);

  const quickAmounts = ['100', '500', '1000', '5000', '10000'];

  const copyAccount = () => {
    navigator.clipboard.writeText('6222 8888 8888 8888 888');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入充值金额');
      return;
    }
    alert(`已提交${amount}元充值申请，请完成转账后联系客服确认`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">存款</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Amount Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="text-gray-500 text-sm mb-2 block">充值金额</label>
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
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="text-gray-500 text-sm mb-3 block">支付方式</label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{method.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <h3 className="font-medium text-gray-900 mb-3">收款信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">收款账户</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">6222 8888 8888 8888 888</span>
                <button onClick={copyAccount} className="p-1">
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">开户行</span>
              <span className="font-medium">中国工商银行</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">户名</span>
              <span className="font-medium">张三</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700 text-sm">
              请转账后联系客服确认，备注您的账号ID
            </p>
          </div>
        </motion.div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg"
        >
          确认充值
        </button>
      </div>
    </div>
  );
}
