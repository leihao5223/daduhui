import React from 'react';

/**
 * 底部文案区（主导航已移至固定底栏 BottomTabBar，与常见 H5 底栏图一致）
 */
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-payment">
          <span className="payment-label">支持支付方式：</span>
          <div className="payment-icons">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-paypal"></i>
            <i className="fab fa-bitcoin"></i>
          </div>
        </div>
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} 大都汇. All rights reserved.</p>
          <p className="disclaimer">博彩有风险，请理性投注。未满18岁禁止参与。</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
