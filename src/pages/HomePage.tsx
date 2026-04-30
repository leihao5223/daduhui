import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Wallet, CreditCard, User, Headphones, UserPlus, Bell, ChevronRight, Trophy, TrendingUp, Shield } from 'lucide-react';

const logoUrl = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-04-30/1777550396573-image.png?auth_key=9b76b96a40c7b392fc30d0ef304ed43f39f05414009ad3e74e6eb35e951d912c';

const getConfig = () => {
  const config = localStorage.getItem('site_config');
  return config ? JSON.parse(config) : {
    banners: [
      { id: 1, image: logoUrl, link: '' },
      { id: 2, image: logoUrl, link: '' },
      { id: 3, image: logoUrl, link: '' },
    ],
    gameImages: [
      { id: 'xinmacau', name: '新澳门六合彩', image: logoUrl, link: '/game/xinmacau' },
      { id: 'laomacau', name: '老澳门六合彩', image: logoUrl, link: '/game/laomacau' },
      { id: 'canada20', name: '加拿大2.0', image: logoUrl, link: '/game/canada20' },
      { id: 'hongkong', name: '香港六合彩', image: logoUrl, link: '/game/hongkong' },
    ],
    notices: ['恭喜用户中奖100万元', '新期即将开奖，敬请期待', '系统维护通知：今晚12点-2点']
  };
};

const features = [
  { icon: Shield, title: '安全保障', desc: '银行级加密技术' },
  { icon: TrendingUp, title: '实时开奖', desc: '秒级同步开奖结果' },
  { icon: Trophy, title: '高额奖金', desc: '千万奖池等你来拿' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ id: '13800138000', balance: 8888.88 });
  const [currentBanner, setCurrentBanner] = useState(0);
  const [config, setConfig] = useState(getConfig());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % config.banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [config.banners.length]);

  const handleNavClick = (tab: string) => {
    const routes: Record<string, string> = {
      home: '/home',
      agent: '/game/agent-rebate',
      deposit: '/deposit',
      withdraw: '/withdraw',
      profile: '/profile'
    };
    navigate(routes[tab] || '/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header - 响应式 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden shadow-lg">
                <img src={logoUrl} alt="大都汇" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold brand-text-gradient">大都汇</h1>
                <p className="text-xs text-slate-500 hidden sm:block">专业彩票投注平台</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-primary-600 font-medium transition-colors">首页</button>
              <button onClick={() => navigate('/game/xinmacau')} className="text-slate-700 hover:text-primary-600 font-medium transition-colors">游戏大厅</button>
              <button onClick={() => navigate('/game/agent-rebate')} className="text-slate-700 hover:text-primary-600 font-medium transition-colors">代理中心</button>
              <button onClick={() => navigate('/service')} className="text-slate-700 hover:text-primary-600 font-medium transition-colors">客服中心</button>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 lg:gap-3">
              {!isLoggedIn ? (
                <>
                  <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    登录
                  </button>
                  <button onClick={() => navigate('/register')} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all">
                    注册
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">余额: <span className="font-bold text-primary-600">¥{userInfo.balance.toFixed(2)}</span></span>
                  <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="container-responsive py-6 lg:py-10">
          <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden aspect-[16/6] lg:aspect-[16/5] shadow-2xl shadow-primary-500/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <img
                  src={config.banners[currentBanner].image}
                  alt="banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 via-primary-900/30 to-transparent" />
                <div className="absolute inset-0 flex items-center p-6 lg:p-12">
                  <div className="max-w-xl">
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl lg:text-4xl font-bold text-white mb-2 lg:mb-4"
                    >
                      大都汇彩票
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm lg:text-lg text-white/90 mb-4 lg:mb-6"
                    >
                      专业、安全、便捷的在线投注平台
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      onClick={() => navigate('/game/xinmacau')}
                      className="px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      立即投注 <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Banner Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {config.banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`h-2 rounded-full transition-all ${idx === currentBanner ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 lg:py-12">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-8 lg:py-12">
        <div className="container-responsive">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900">热门彩种</h2>
            <button onClick={() => navigate('/game/xinmacau')} className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {config.gameImages.map((game, idx) => (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(game.link)}
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{game.name}</h3>
                  <p className="text-white/80 text-sm">立即投注</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Notice Bar */}
      <section className="py-6">
        <div className="container-responsive">
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <Bell className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-primary-800 animate-pulse">{config.notices[0]}</p>
            </div>
            <button onClick={() => navigate('/notifications')} className="text-primary-600 text-sm font-medium">
              更多
            </button>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 lg:py-12">
        <div className="container-responsive">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/deposit')}
              className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white text-center shadow-lg shadow-primary-500/30"
            >
              <Wallet className="w-8 h-8 mx-auto mb-2" />
              <span className="font-semibold">充值</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/withdraw')}
              className="p-6 bg-white rounded-2xl text-slate-700 text-center border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <span className="font-semibold">提现</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/game/agent-rebate')}
              className="p-6 bg-white rounded-2xl text-slate-700 text-center border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <span className="font-semibold">代理</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/service')}
              className="p-6 bg-white rounded-2xl text-slate-700 text-center border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <Headphones className="w-8 h-8 mx-auto mb-2 text-primary-600" />
              <span className="font-semibold">客服</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          <button onClick={() => handleNavClick('home')} className="flex flex-col items-center gap-1 py-2 px-3 text-primary-600">
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">首页</span>
          </button>
          <button onClick={() => handleNavClick('agent')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-400 hover:text-primary-600 transition-colors">
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">代理</span>
          </button>
          <button onClick={() => handleNavClick('deposit')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-400 hover:text-primary-600 transition-colors">
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-medium">充值</span>
          </button>
          <button onClick={() => handleNavClick('withdraw')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-400 hover:text-primary-600 transition-colors">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">提现</span>
          </button>
          <button onClick={() => handleNavClick('profile')} className="flex flex-col items-center gap-1 py-2 px-3 text-slate-400 hover:text-primary-600 transition-colors">
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">我的</span>
          </button>
        </div>
      </div>

      {/* Footer Spacer for Mobile */}
      <div className="lg:hidden h-20" />

      {/* Desktop Footer */}
      <footer className="hidden lg:block bg-slate-900 text-slate-400 py-12">
        <div className="container-responsive">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">关于大都汇</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition-colors">平台介绍</button></li>
                <li><button className="hover:text-white transition-colors">联系我们</button></li>
                <li><button className="hover:text-white transition-colors">加入我们</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">帮助中心</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition-colors">新手指南</button></li>
                <li><button className="hover:text-white transition-colors">充值提现</button></li>
                <li><button className="hover:text-white transition-colors">常见问题</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">安全保障</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition-colors">隐私政策</button></li>
                <li><button className="hover:text-white transition-colors">服务条款</button></li>
                <li><button className="hover:text-white transition-colors"> responsible gaming</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">联系方式</h4>
              <p className="text-sm">客服热线：400-888-8888</p>
              <p className="text-sm">工作时间：7×24小时</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2026 大都汇彩票 版权所有</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
