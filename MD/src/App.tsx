import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './styles/cyber-chinese-login.css';

// LOGO图片URL - 已抠图版本
const LOGO_URL = 'https://conversation.cdn.meoo.host/conversations/308104559711129600/image/2026-05-01/1777643025158-photo_2026-04-27_20-34-05__2_-removebg-preview.png?auth_key=7f9bc161a11fb7529faa421da3995ced32e8911ca0d41ef75a0e9071e76a9288';

function CyberChineseLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('登录:', { username, password });
    // 这里可以添加实际的登录逻辑
  };
  
  return (
    <div className="cyber-login-container">
      {/* 背景层 - 极度强化科技感 */}
      
      {/* 第1层：基础网格脉冲 */}
      <div className="bg-grid-pulse"></div>
      
      {/* 第2层：数据流粒子 */}
      {[...Array(30)].map((_, i) => (
        <div key={`stream-${i}`} className="data-stream"></div>
      ))}
      
      {/* 第3层：浮动灯笼 */}
      <div className="floating-lantern lantern-1"></div>
      <div className="floating-lantern lantern-2"></div>
      <div className="floating-lantern lantern-3"></div>
      <div className="floating-lantern lantern-4"></div>
      <div className="floating-lantern lantern-5"></div>
      <div className="floating-lantern lantern-6"></div>
      <div className="floating-lantern lantern-7"></div>
      <div className="floating-lantern lantern-8"></div>
      <div className="floating-lantern lantern-9"></div>
      <div className="floating-lantern lantern-10"></div>
      
      {/* 第4层：云纹流动 */}
      {[...Array(7)].map((_, i) => (
        <div key={`cloud-${i}`} className={`cloud-flow cloud-${i + 1}`}>
          <svg viewBox="0 0 250 80" fill="none">
            <path d="M30,40 Q60,15 90,40 T150,40 T210,40" stroke="#c9a227" strokeWidth="2.5" fill="none"/>
          </svg>
        </div>
      ))}
      
      {/* 第5层：霓虹光带穿梭 */}
      {[...Array(10)].map((_, i) => (
        <div key={`ribbon-${i}`} className={`neon-ribbon ribbon-${i + 1}`}></div>
      ))}
      
      {/* 第6层：扫描线效果 */}
      <div className="scan-line"></div>
      
      {/* 第7层：粒子漂浮 */}
      {[...Array(20)].map((_, i) => (
        <div key={`particle-${i}`} className={`particle particle-${i + 1}`}></div>
      ))}
      
      {/* 第8层：角落装饰光效 */}
      <div className="corner-glow corner-tl"></div>
      <div className="corner-glow corner-tr"></div>
      <div className="corner-glow corner-bl"></div>
      <div className="corner-glow corner-br"></div>
      
      {/* 第9层：中心光晕 */}
      <div className="center-glow"></div>
      
      {/* 主内容区 */}
      <div className="login-content">
        {/* LOGO区域 */}
        <motion.div
          className="logo-area"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <img src={LOGO_URL} alt="大都汇舞台LOGO" className="logo-img" />
        </motion.div>
        
        {/* 标题区域 */}
        <motion.div 
          className="title-section"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="main-title">大都汇舞台</h1>
          <p className="subtitle">想富你就来</p>
        </motion.div>
        
        {/* 登录表单卡片 */}
        <motion.div 
          className="login-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <form onSubmit={handleLogin}>
            {/* 账号输入框 */}
            <div className="input-group">
              <label className="input-label" htmlFor="username">账号</label>
              <input
                type="text"
                id="username"
                className="input-field"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            {/* 密码输入框 */}
            <div className="input-group">
              <label className="input-label" htmlFor="password">密码</label>
              <input
                type="password"
                id="password"
                className="input-field"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* 登录按钮 */}
            <motion.button
              type="submit"
              className="login-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              立即登录
            </motion.button>
            
            {/* 链接区域 */}
            <div className="link-area">
              <a href="#" className="link-item">注册</a>
              <a href="#" className="link-item">忘记密码</a>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function App() {
  return <CyberChineseLogin />;
}

export default App;