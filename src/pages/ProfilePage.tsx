import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, User, Wallet, Settings, Bell, Shield, 
  HelpCircle, LogOut, ChevronRight, Crown, Gift, 
  TrendingUp, CreditCard, FileText, Award
} from 'lucide-react';

const logoUrl = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-04-30/1777550396573-image.png?auth_key=9b76b96a40c7b392fc30d0ef304ed43f39f05414009ad3e74e6eb35e951d912c';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userInfo] = useState({
    id: '13800138000',
    nickname: '大都汇用户',
    balance: 8888.88,
    level: 'VIP3',
    points: 12580
  });

  const menuGroups = [
    {
      title: '财务管理',
      items: [
        { id: 'wallet', name: '我的钱包', icon: Wallet, path: '/transactions', badge: null },
        { id: 'deposit', name: '充值中心', icon: CreditCard, path: '/deposit', badge: '优惠' },
        { id: 'withdraw', name: '快速提现', icon: TrendingUp, path: '/withdraw', badge: null },
        { id: 'bet', name: '投注记录', icon: FileText, path: '/bet-history', badge: null },
      ]
    },
    {
      title: '账户服务',
      items: [
        { id: 'settings', name: '账户设置', icon: Settings, path: '/settings', badge: null },
        { id: 'security', name: '安全中心', icon: Shield, path: '/set-fund-password', badge: '推荐' },
        { id: 'notice', name: '消息通知', icon: Bell, path: '/notifications', badge: '3' },
        { id: 'vip', name: 'VIP特权', icon: Crown, path: '/game/agent-rebate', badge: 'VIP3' },
      ]
    },
    {
      title: '其他服务',
      items: [
        { id: 'help', name: '帮助中心', icon: HelpCircle, path: '/service', badge: null },
        { id: 'promo', name: '优惠活动', icon: Gift, path: '/notifications', badge: '新' },
        { id: 'invite', name: '邀请好友', icon: Award, path: '/game/agent-rebate', badge: '赚佣金' },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">个人中心</h1>
            </div>
            <button onClick={() => navigate('/settings')} className="p-2 text-slate-600 hover:text-slate-900">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container-responsive py-6 space-y-6">
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white shadow-xl shadow-primary-500/30"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg">
                  <img src={logoUrl} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                  {userInfo.level}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-xl mb-1">{userInfo.nickname}</h2>
                <p className="text-primary-100 text-sm">ID: {userInfo.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs">
                    <Award className="w-3 h-3" />
                    <span>{userInfo.points} 积分</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <p className="text-primary-100 text-sm mb-1">账户余额</p>
                <p className="text-3xl font-bold">¥{userInfo.balance.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate('/deposit')}
                  className="px-5 py-2.5 bg-white text-primary-600 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  充值
                </button>
                <button 
                  onClick={() => navigate('/withdraw')}
                  className="px-5 py-2.5 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
                >
                  提现
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: '本周盈亏', value: '+¥1,280', color: 'text-green-600', bg: 'bg-green-50' },
            { label: '投注次数', value: '128次', color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: '中奖次数', value: '32次', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
              <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Menu Groups */}
        {menuGroups.map((group, groupIdx) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + groupIdx * 0.1 }}
          >
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
              {group.title}
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="flex-1 text-slate-900 font-medium text-left">{item.name}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.badge === '新' || item.badge === '优惠' 
                          ? 'bg-red-100 text-red-600' 
                          : item.badge === '推荐'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-primary-100 text-primary-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 text-red-500 hover:bg-red-50 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="flex-1 font-medium text-left">退出登录</span>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.button>

        {/* Version */}
        <p className="text-center text-slate-400 text-sm pb-6">大都汇 v2.0.0</p>
      </div>
    </div>
  );
}
