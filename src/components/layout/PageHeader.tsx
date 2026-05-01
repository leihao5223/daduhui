import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  /** 返回路径，默认首页 */
  backTo?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backTo = '/' }) => {
  const navigate = useNavigate();

  return (
    <header className="dx-page-header">
      <button type="button" className="dx-page-back" onClick={() => navigate(backTo)} aria-label="返回">
        ←
      </button>
      <h1 className="dx-page-title">{title}</h1>
      <span className="dx-page-header-spacer" aria-hidden />
    </header>
  );
};
