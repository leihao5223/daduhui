import React from 'react';
import { type PlaceholderPageKey, placeholderContent } from '../content/placeholders';

interface PlaceholderPageProps {
  pageKey: PlaceholderPageKey;
}

/**
 * 尚未接入完整业务的模块：文案集中在 `src/content/placeholders.ts`。
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ pageKey }) => {
  const { title, description } = placeholderContent[pageKey];
  return (
    <section className="page-placeholder">
      <div className="page-placeholder-inner">
        <h1 className="page-placeholder-title">{title}</h1>
        <p className="page-placeholder-desc">{description}</p>
      </div>
    </section>
  );
};

export default PlaceholderPage;
