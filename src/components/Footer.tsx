import React from 'react';
import { siteContent } from '../content/site';
import { layoutContent } from '../content/layout';

/**
 * 底部文案区（主导航已移至固定底栏 BottomTabBar）
 */
const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-payment">
          <span className="payment-label">{layoutContent.footerPaymentLabel}</span>
          <div className="payment-icons">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-paypal"></i>
            <i className="fab fa-bitcoin"></i>
          </div>
        </div>
        <div className="footer-copyright">
          <p>{siteContent.footerCopyright(year)}</p>
          <p className="disclaimer">{siteContent.footerDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
