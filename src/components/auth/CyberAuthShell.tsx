import React from 'react';
import { motion } from 'framer-motion';

/** 登录/注册页专用抠图 LOGO（与顶栏 `daduhui-logo.png` 区分） */
const LOGIN_LOGO_SRC = new URL('../../../assets/daduhui-stage-logo.png', import.meta.url).href;

export interface CyberAuthShellProps {
  /** 主标题文案 */
  mainTitle: string;
  /** 副标题 */
  subtitle: string;
  /** 注册等长表单时可纵向滚动 */
  scroll?: boolean;
  /** 追加到 .main-title */
  titleClassName?: string;
  children: React.ReactNode;
}

/**
 * MD 目录「大都汇舞台」赛博国风登录视觉：背景层 + LOGO + 标题区 + 卡片插槽
 */
export const CyberAuthShell: React.FC<CyberAuthShellProps> = ({
  mainTitle,
  subtitle,
  scroll,
  titleClassName,
  children,
}) => {
  return (
    <div className={`cyber-login-scope cyber-login-container ${scroll ? 'cyber-login-container--scroll' : ''}`}>
      <div className="bg-grid-pulse" />

      {[...Array(30)].map((_, i) => (
        <div key={`stream-${i}`} className="data-stream" />
      ))}

      <div className="floating-lantern lantern-1" />
      <div className="floating-lantern lantern-2" />
      <div className="floating-lantern lantern-3" />
      <div className="floating-lantern lantern-4" />
      <div className="floating-lantern lantern-5" />
      <div className="floating-lantern lantern-6" />
      <div className="floating-lantern lantern-7" />
      <div className="floating-lantern lantern-8" />
      <div className="floating-lantern lantern-9" />
      <div className="floating-lantern lantern-10" />

      {[...Array(7)].map((_, i) => (
        <div key={`cloud-${i}`} className={`cloud-flow cloud-${i + 1}`}>
          <svg viewBox="0 0 250 80" fill="none">
            <path
              d="M30,40 Q60,15 90,40 T150,40 T210,40"
              stroke="#c9a227"
              strokeWidth="2.5"
              fill="none"
            />
          </svg>
        </div>
      ))}

      {[...Array(10)].map((_, i) => (
        <div key={`ribbon-${i}`} className={`neon-ribbon ribbon-${i + 1}`} />
      ))}

      <div className="scan-line" />

      {[...Array(20)].map((_, i) => (
        <div key={`particle-${i}`} className={`particle particle-${i + 1}`} />
      ))}

      <div className="corner-glow corner-tl" />
      <div className="corner-glow corner-tr" />
      <div className="corner-glow corner-bl" />
      <div className="corner-glow corner-br" />

      <div className="center-glow" />

      <div className="login-content">
        <motion.div
          className="logo-area"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <img src={LOGIN_LOGO_SRC} alt="大都汇" className="logo-img" />
        </motion.div>

        <motion.div
          className="title-section"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className={`main-title ${titleClassName ?? ''}`.trim()}>{mainTitle}</h1>
          <p className="subtitle">{subtitle}</p>
        </motion.div>

        {children}
      </div>
    </div>
  );
};
