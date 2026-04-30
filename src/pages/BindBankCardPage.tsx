import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Building2, CreditCard, User } from 'lucide-react';

const banks = [
  '中国工商银行', '中国建设银行', '中国农业银行', '中国银行',
  '招商银行', '交通银行', '中信银行', '光大银行',
  '民生银行', '平安银行', '浦发银行', '兴业银行'
];

export default function BindBankCardPage() {
  const navigate = useNavigate();
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!bankName || !cardNumber || !accountName) {
      setError('请填写完整信息');
      return;
    }
    if (cardNumber.length < 16) {
      setError('请输入正确的银行卡号');
      return;
    }
    // 保存银行卡信息
    localStorage.setItem('hasBankCard', 'true');
    localStorage.setItem('bankInfo', JSON.stringify({
      bankName,
      cardNumber,
      accountName
    }));
    alert('银行卡绑定成功！');
    navigate(-1);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">绑定银行卡</h1>
      </div>

      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-gray-600 text-sm mb-2 block">开户银行</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  onClick={() => setShowBankList(!showBankList)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-left focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                >
                  {bankName || '请选择开户银行'}
                </button>
              </div>
              {showBankList && (
                <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {banks.map((bank) => (
                    <button
                      key={bank}
                      onClick={() => {
                        setBankName(bank);
                        setShowBankList(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-gray-600 text-sm mb-2 block">银行卡号</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="请输入银行卡号"
                  maxLength={23}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-600 text-sm mb-2 block">户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="请输入户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors mt-6"
            >
              确认绑定
            </button>
          </div>
        </motion.div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
          <p className="text-yellow-700 text-sm">
            温馨提示：请确保银行卡信息准确无误，以免影响提现到账
          </p>
        </div>
      </div>
    </div>
  );
}
