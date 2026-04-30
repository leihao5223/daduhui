import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Lock, CreditCard, Shield, Camera } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    id: '',
    nickname: '',
    avatar: 'https://via.placeholder.com/80/3b82f6/ffffff?text=U',
    hasFundPassword: false,
    hasBankCard: false,
    isRealName: false
  });

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserInfo(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  const handleAvatarChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newAvatar = event.target?.result as string;
          setUserInfo(prev => ({ ...prev, avatar: newAvatar }));
          const stored = localStorage.getItem('userInfo');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatar = newAvatar;
            localStorage.setItem('userInfo', JSON.stringify(parsed));
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleNicknameChange = () => {
    const newNickname = prompt('请输入新昵称', userInfo.nickname);
    if (newNickname && newNickname.trim()) {
      setUserInfo(prev => ({ ...prev, nickname: newNickname.trim() }));
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.nickname = newNickname.trim();
        localStorage.setItem('userInfo', JSON.stringify(parsed));
      }
    }
  };

  const menuItems = [
    { id: 'nickname', name: '修改昵称', icon: User, value: userInfo.nickname || '未设置', action: handleNicknameChange },
    { id: 'password', name: '修改登录密码', icon: Lock, value: '', action: () => navigate('/change-password') },
    { id: 'fundPassword', name: '设置资金密码', icon: CreditCard, value: userInfo.hasFundPassword ? '已设置' : '未设置', action: () => navigate('/set-fund-password') },
    { id: 'bankCard', name: '绑定银行卡', icon: CreditCard, value: userInfo.hasBankCard ? '已绑定' : '未绑定', action: () => navigate('/bind-bank-card') },
    { id: 'realName', name: '实名认证', icon: Shield, value: userInfo.isRealName ? '已认证' : '未认证', action: () => alert('实名认证功能开发中') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">设置</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 text-center"
        >
          <div className="relative inline-block">
            <img
              src={userInfo.avatar}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-blue-500"
            />
            <button
              onClick={handleAvatarChange}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-gray-900 font-medium">{userInfo.nickname || userInfo.id}</p>
          <p className="text-gray-500 text-sm">ID: {userInfo.id}</p>
        </motion.div>

        {/* Menu List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-gray-900 font-medium">{item.name}</span>
                  {item.value && (
                    <span className="text-gray-400 text-sm ml-2">{item.value}</span>
                  )}
                </div>
                <span className="text-gray-400 text-lg">›</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
