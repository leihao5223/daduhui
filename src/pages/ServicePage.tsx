import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupportChat } from '../context/SupportChatContext';
import {
  ChevronLeft, MessageCircle, Phone, Mail, ChevronDown, ChevronUp,
  Send, Clock, Shield, Headphones, Sparkles, X, CheckCircle2
} from 'lucide-react';

const logoUrl = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-04-30/1777550396573-image.png?auth_key=9b76b96a40c7b392fc30d0ef304ed43f39f05414009ad3e74e6eb35e951d912c';

const faqs = [
  { id: 1, question: '如何充值？', answer: '您可以通过银行卡转账、支付宝、微信支付等方式进行充值。充值成功后请联系客服确认。' },
  { id: 2, question: '提现多久到账？', answer: '提现申请提交后，预计1-3个工作日到账，具体以银行处理时间为准。' },
  { id: 3, question: '如何设置资金密码？', answer: '进入个人中心-设置-设置资金密码，设置后提现时需要验证资金密码。' },
  { id: 4, question: '中奖奖金什么时候到账？', answer: '开奖后奖金会自动到账到您的账户余额中。' },
  { id: 5, question: '如何成为代理？', answer: '进入代理中心，设置抽佣比例并生成邀请码，邀请好友注册即可获得返佣。' },
  { id: 6, question: '忘记密码怎么办？', answer: '点击登录页面的"忘记密码"，按照提示进行密码重置操作。' },
];

const contactMethods = [
  { id: 'online', name: '在线客服', icon: MessageCircle, value: '7×24小时在线', color: 'from-primary-500 to-primary-600' },
  { id: 'phone', name: '客服热线', icon: Phone, value: '400-888-8888', color: 'from-green-500 to-green-600' },
  { id: 'email', name: '客服邮箱', icon: Mail, value: 'service@daduhui.com', color: 'from-amber-500 to-amber-600' },
];

export default function ServicePage() {
  const navigate = useNavigate();
  const { openChat } = useSupportChat();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'system', content: '您好！欢迎来到大都汇客服中心，有什么可以帮助您的吗？', time: '10:00' }
  ]);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages(prev => [...prev, { id: Date.now(), type: 'user', content: message, time }]);
    setMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: Date.now() + 1, type: 'system', content: '客服正在为您查询，请稍候...', time }]);
    }, 1000);
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
              <h1 className="text-xl font-bold text-slate-900">客服中心</h1>
            </div>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <img src={logoUrl} alt="大都汇" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-6 space-y-6">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 lg:p-8 text-white"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">大都汇客服中心</h2>
                <p className="text-primary-100 text-sm">7×24小时为您服务</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>专业客服团队</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>秒级响应</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>隐私保护</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {contactMethods.map((method, idx) => (
            <motion.button
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => method.id === 'online' && setShowChat(true)}
              className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${method.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white shadow-lg mb-4`}>
                  <method.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{method.name}</h3>
                <p className="text-slate-500">{method.value}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            快速服务
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {['充值问题', '提现问题', '账号安全', '代理咨询'].map((item, idx) => (
              <button
                key={item}
                onClick={() => setShowChat(true)}
                className="p-4 bg-slate-50 rounded-xl text-slate-700 font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors text-center"
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            常见问题
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                      Q
                    </span>
                    <span className="font-medium text-slate-900 text-left">{faq.question}</span>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="pl-9">
                          <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Online Chat CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white text-center"
        >
          <h3 className="font-bold text-xl mb-2">还有其他问题？</h3>
          <p className="text-primary-100 mb-4">我们的客服团队随时为您解答</p>
            <button
              onClick={() => openChat()}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              立即咨询
            </button>
        </motion.div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-lg h-[85vh] sm:h-[600px] sm:rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">在线客服</h3>
                    <div className="flex items-center gap-1 text-primary-100 text-xs">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      客服在线中
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)} 
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 h-[calc(85vh-140px)] sm:h-[420px] overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'system' && (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0">
                        <Headphones className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${msg.type === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                          msg.type === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-slate-700 shadow-sm border border-slate-100'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="请输入您的问题..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  客服工作时间：7×24小时在线
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
