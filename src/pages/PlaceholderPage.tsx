import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

/**
 * 各业务模块占位页，后续替换为真实功能。
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <section className="page-placeholder">
      <div className="page-placeholder-inner">
        <h1 className="page-placeholder-title">{title}</h1>
        <p className="page-placeholder-desc">该模块开发中，敬请期待。</p>
      </div>
    </section>
  );
};

export default PlaceholderPage;
