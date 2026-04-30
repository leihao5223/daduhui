import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, Trash2, CheckCircle, Volume2 } from 'lucide-react';

const initialNotifications = [
  { id: 1, title: '系统公告', content: '新澳门六合彩第2026046期即将开奖，请及时投注', time: '2026-05-02 20:00', read: false, type: 'system' },
  { id: 2, title: '中奖通知', content: '恭喜您！您投注的新澳门六合彩特码中奖，奖金¥480已到账', time: '2026-05-01 20:35', read: false, type: 'win' },
  { id: 3, title: '充值成功', content: '您的充值申请已通过审核，¥1000已到账', time: '2026-05-02 14:35', read: true, type: 'deposit' },
  { id: 4, title: '系统维护', content: '系统将于今晚23:00-01:00进行维护，期间暂停服务', time: '2026-04-30 18:00', read: true, type: 'system' },
  { id: 5, title: '代理返佣', content: '您的下级产生投注，获得返佣¥28', time: '2026-04-30 00:00', read: true, type: 'rebate' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.read);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'win': return <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-orange-600 text-lg">🎉</span></div>;
      case 'deposit': return <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><span className="text-green-600 text-lg">💰</span></div>;
      case 'rebate': return <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><span className="text-purple-600 text-lg">🎁</span></div>;
      default: return <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Bell className="w-5 h-5 text-blue-600" /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">消息中心</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
          )}
        </div>
        <button onClick={markAllAsRead} className="text-blue-600 text-sm">
          全部已读
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-6">
          {[
            { id: 'all', name: '全部' },
            { id: 'unread', name: '未读' },
            { id: 'read', name: '已读' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4 space-y-3">
        {filteredNotifications.map((n, idx) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-white rounded-xl border ${n.read ? 'border-gray-200' : 'border-blue-300'} p-4`}
            onClick={() => markAsRead(n.id)}
          >
            <div className="flex gap-3">
              {getIcon(n.type)}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {n.title}
                    {!n.read && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block" />}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-sm mt-1 ${n.read ? 'text-gray-500' : 'text-gray-700'}`}>
                  {n.content}
                </p>
                <p className="text-gray-400 text-xs mt-2">{n.time}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Volume2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无消息</p>
          </div>
        )}
      </div>
    </div>
  );
}
