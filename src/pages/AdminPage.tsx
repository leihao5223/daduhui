import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Image, Gamepad, Volume2, Save, Users, MessageCircle,
  TrendingUp, DollarSign, Settings, Bell, Search, Filter,
  CheckCircle, XCircle, Clock, MoreHorizontal, Headphones,
  Send, Paperclip, Smile, Phone, Mail, ChevronDown, ChevronRight,
  BarChart3, PieChart, Activity, CreditCard, Wallet, UserPlus,
  Shield, AlertCircle, FileText, Download, RefreshCw, LogOut
} from 'lucide-react';

const logoUrl = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-04-30/1777550396573-image.png?auth_key=9b76b96a40c7b392fc30d0ef304ed43f39f05414009ad3e74e6eb35e951d912c';

interface SiteConfig {
  banners: { id: number; image: string; link: string }[];
  gameImages: { id: string; image: string; link: string }[];
  notices: string[];
}

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: 'online' | 'offline' | 'busy';
  tags: string[];
}

interface User {
  id: string;
  name: string;
  phone: string;
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
  registerTime: string;
  lastLogin: string;
  status: 'active' | 'banned' | 'suspended';
  vip: number;
}

const defaultConfig: SiteConfig = {
  banners: [
    { id: 1, image: logoUrl, link: '' },
    { id: 2, image: logoUrl, link: '' },
    { id: 3, image: logoUrl, link: '' },
  ],
  gameImages: [
    { id: 'xinmacau', image: logoUrl, link: '/game/xinmacau' },
    { id: 'laomacau', image: logoUrl, link: '/game/laomacau' },
    { id: 'canada20', image: logoUrl, link: '/game/canada20' },
  ],
  notices: ['恭喜用户中奖', '新期即将开奖', '系统维护通知']
};

const mockSessions: ChatSession[] = [
  { id: '1', userId: '13800138000', userName: '张三', avatar: logoUrl, lastMessage: '充值多久能到账？', lastTime: '10:23', unread: 2, status: 'online', tags: ['充值问题'] },
  { id: '2', userId: '13800138001', userName: '李四', avatar: logoUrl, lastMessage: '提现失败了', lastTime: '09:45', unread: 1, status: 'offline', tags: ['提现问题'] },
  { id: '3', userId: '13800138002', userName: '王五', avatar: logoUrl, lastMessage: '谢谢客服', lastTime: '昨天', unread: 0, status: 'online', tags: [] },
  { id: '4', userId: '13800138003', userName: '赵六', avatar: logoUrl, lastMessage: '怎么成为代理？', lastTime: '昨天', unread: 0, status: 'busy', tags: ['代理咨询'] },
  { id: '5', userId: '13800138004', userName: '钱七', avatar: logoUrl, lastMessage: '密码忘记了', lastTime: '前天', unread: 0, status: 'offline', tags: ['账号问题'] },
];

const mockUsers: User[] = [
  { id: '13800138000', name: '张三', phone: '138****8000', balance: 8888.88, totalDeposit: 50000, totalWithdraw: 30000, registerTime: '2026-01-15', lastLogin: '2026-04-30 10:30', status: 'active', vip: 3 },
  { id: '13800138001', name: '李四', phone: '138****8001', balance: 5200.00, totalDeposit: 30000, totalWithdraw: 15000, registerTime: '2026-02-20', lastLogin: '2026-04-30 09:45', status: 'active', vip: 2 },
  { id: '13800138002', name: '王五', phone: '138****8002', balance: 1200.50, totalDeposit: 10000, totalWithdraw: 8000, registerTime: '2026-03-10', lastLogin: '2026-04-29 18:20', status: 'active', vip: 1 },
  { id: '13800138003', name: '赵六', phone: '138****8003', balance: 0, totalDeposit: 5000, totalWithdraw: 5000, registerTime: '2026-03-25', lastLogin: '2026-04-28 15:00', status: 'suspended', vip: 0 },
];

const quickReplies = [
  { id: '1', title: '充值到账时间', content: '充值提交后由人工核对，一般当日处理，请保持在线。' },
  { id: '2', title: '提现规则', content: '提现需在工作日 9:00—21:00 发起，具体以风控审核为准。' },
  { id: '3', title: '修改银行卡', content: '请发送开户名与卡号后四位，我们将引导您完成核验。' },
  { id: '4', title: '代理申请', content: '代理申请需要满足充值满10000元，请联系客服提交申请。' },
  { id: '5', title: '密码重置', content: '请点击登录页面的"忘记密码"，按照提示进行密码重置操作。' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newNotice, setNewNotice] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'unread'>('all');

  useEffect(() => {
    const stored = localStorage.getItem('site_config');
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('site_config', JSON.stringify(config));
    alert('配置已保存');
  };

  const addBanner = () => {
    if (!newImageUrl) return;
    setConfig(prev => ({
      ...prev,
      banners: [...prev.banners, { id: Date.now(), image: newImageUrl, link: '' }]
    }));
    setNewImageUrl('');
  };

  const removeBanner = (id: number) => {
    setConfig(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== id)
    }));
  };

  const updateGameImage = (id: string, image: string) => {
    setConfig(prev => ({
      ...prev,
      gameImages: prev.gameImages.map(g => g.id === id ? { ...g, image } : g)
    }));
  };

  const addNotice = () => {
    if (!newNotice) return;
    setConfig(prev => ({
      ...prev,
      notices: [...prev.notices, newNotice]
    }));
    setNewNotice('');
  };

  const removeNotice = (idx: number) => {
    setConfig(prev => ({
      ...prev,
      notices: prev.notices.filter((_, i) => i !== idx)
    }));
  };

  const filteredSessions = mockSessions.filter(session => {
    if (filterStatus === 'online') return session.status === 'online';
    if (filterStatus === 'unread') return session.unread > 0;
    return true;
  }).filter(session => 
    session.userName.includes(searchQuery) || 
    session.lastMessage.includes(searchQuery)
  );

  const stats = [
    { label: '今日注册用户', value: '128', change: '+12%', icon: UserPlus, color: 'bg-blue-500' },
    { label: '今日充值金额', value: '¥128,888', change: '+23%', icon: CreditCard, color: 'bg-green-500' },
    { label: '今日提现金额', value: '¥86,520', change: '+8%', icon: Wallet, color: 'bg-amber-500' },
    { label: '在线用户', value: '1,286', change: '+5%', icon: Users, color: 'bg-purple-500' },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className="text-green-500 text-sm mt-1">{stat.change}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">充值趋势</h3>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1">
              <option>最近7天</option>
              <option>最近30天</option>
            </select>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-slate-500">{['一','二','三','四','五','六','日'][i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">用户分布</h3>
            <button className="text-sm text-primary-600 hover:underline">查看详情</button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'VIP用户', value: 328, total: 1286, color: 'bg-amber-500' },
              { label: '普通用户', value: 856, total: 1286, color: 'bg-primary-500' },
              { label: '新注册用户', value: 102, total: 1286, color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value}人</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div 
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">最近动态</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { action: '用户充值', user: '张三', amount: '¥10,000', time: '2分钟前', type: 'success' },
            { action: '用户提现', user: '李四', amount: '¥5,000', time: '5分钟前', type: 'warning' },
            { action: '新用户注册', user: '王五', amount: '-', time: '10分钟前', type: 'info' },
            { action: '用户中奖', user: '赵六', amount: '¥88,888', time: '15分钟前', type: 'success' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'success' ? 'bg-green-500' : 
                  item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className="text-slate-900">{item.action}</span>
                <span className="text-slate-500">-</span>
                <span className="text-slate-700 font-medium">{item.user}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-900">{item.amount}</span>
                <span className="text-sm text-slate-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderSupport = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Session List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-600" />
              客服会话
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                {mockSessions.reduce((acc, s) => acc + s.unread, 0)}
              </span>
            </h3>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">全部</option>
              <option value="online">在线</option>
              <option value="unread">未读</option>
            </select>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-100px)]">
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                selectedSession?.id === session.id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="relative">
                <img src={session.avatar} alt="" className="w-10 h-10 rounded-full" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  session.status === 'online' ? 'bg-green-500' : 
                  session.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{session.userName}</span>
                  <span className="text-xs text-slate-400">{session.lastTime}</span>
                </div>
                <p className="text-sm text-slate-500 truncate">{session.lastMessage}</p>
                <div className="flex items-center gap-2 mt-1">
                  {session.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {session.unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                  {session.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedSession.avatar} alt="" className="w-10 h-10 rounded-full" />
                <div>
                  <h4 className="font-semibold text-slate-900">{selectedSession.userName}</h4>
                  <p className="text-xs text-slate-500">ID: {selectedSession.userId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Mail className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-4 bg-slate-50">
              <div className="text-center">
                <span className="text-xs text-slate-400">会话开始于 {selectedSession.lastTime}</span>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <p className="text-slate-700">{selectedSession.lastMessage}</p>
                  <span className="text-xs text-slate-400 mt-1">{selectedSession.lastTime}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[70%] bg-primary-600 rounded-2xl rounded-tr-none px-4 py-3 text-white">
                  <p>您好，已收到您的消息，客服专员正在处理，请稍候...</p>
                  <span className="text-xs text-primary-200 mt-1">刚刚</span>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100">
              {showQuickReplies && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {quickReplies.map(reply => (
                    <button
                      key={reply.id}
                      onClick={() => {
                        setChatMessage(reply.content);
                        setShowQuickReplies(false);
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      {reply.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showQuickReplies ? 'rotate-180' : ''}`} />
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="输入消息..."
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                />
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">用户管理</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户..."
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <button className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm">
            导出数据
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">手机号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">余额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">累计充值</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">累计提现</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">VIP</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">ID: {user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.phone}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">¥{user.balance.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">¥{user.totalDeposit.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-600">¥{user.totalWithdraw.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                    VIP{user.vip}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' :
                    user.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {user.status === 'active' ? '正常' : 
                     user.status === 'suspended' ? '暂停' : '封禁'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-sm text-primary-600 hover:underline">详情</button>
                    <button className="text-sm text-slate-600 hover:underline">编辑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', name: '数据概览', icon: BarChart3 },
    { id: 'support', name: '客服中心', icon: Headphones },
    { id: 'users', name: '用户管理', icon: Users },
    { id: 'banners', name: '轮播图', icon: Image },
    { id: 'games', name: '游戏配置', icon: Gamepad },
    { id: 'notices', name: '公告管理', icon: Volume2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src={logoUrl} alt="大都汇" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">大都汇管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  管
                </div>
                <span className="text-sm text-slate-700 hidden sm:block">管理员</span>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                    {tab.id === 'support' && (
                      <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                        3
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'support' && renderSupport()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'banners' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="font-medium text-slate-900 mb-3">添加轮播图</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="输入图片URL"
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                        />
                        <button
                          onClick={addBanner}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {config.banners.map((banner) => (
                        <div key={banner.id} className="bg-white rounded-xl border border-slate-200 p-3">
                          <img src={banner.image} alt="banner" className="w-full h-32 object-cover rounded-lg mb-2" />
                          <button
                            onClick={() => removeBanner(banner.id)}
                            className="w-full py-2 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'games' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {config.gameImages.map((game) => (
                      <div key={game.id} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-medium text-slate-900">{game.id}</span>
                        </div>
                        <img src={game.image} alt={game.id} className="w-full h-24 object-cover rounded-lg mb-2" />
                        <input
                          type="text"
                          value={game.image}
                          onChange={(e) => updateGameImage(game.id, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'notices' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="font-medium text-slate-900 mb-3">添加公告</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNotice}
                          onChange={(e) => setNewNotice(e.target.value)}
                          placeholder="输入公告内容"
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                        />
                        <button
                          onClick={addNotice}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {config.notices.map((notice, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3 flex justify-between items-center">
                          <span className="text-slate-700">{notice}</span>
                          <button
                            onClick={() => removeNotice(idx)}
                            className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
