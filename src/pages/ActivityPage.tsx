import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { apiGet } from '../api/http';
import { activityContent } from '../content/activity';

type Article = { id: string; title: string; body: string; updatedAt?: string | null };

const ActivityPage: React.FC = () => {
  const [list, setList] = useState<Article[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await apiGet<{ success?: boolean; list?: Article[] }>('/api/activity/articles');
        if (cancelled) return;
        if (r.success && Array.isArray(r.list)) setList(r.list);
        else {
          setList([]);
          setError(true);
        }
      } catch {
        if (!cancelled) {
          setList([]);
          setError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dx-page">
      <PageHeader title={activityContent.pageTitle} backTo="/" />
      <main className="dx-page-main">
        {list === null ? (
          <p className="dx-loading-line">{activityContent.loading}</p>
        ) : error ? (
          <section className="dx-card" style={{ padding: '1rem 1.1rem' }}>
            <p style={{ margin: 0, opacity: 0.85 }}>{activityContent.loadError}</p>
          </section>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {list.map((row) => {
              const title = row.title?.trim() || activityContent.emptyTitle;
              const body = row.body?.trim() || activityContent.emptyBody;
              return (
                <article
                  key={row.id}
                  className="dx-card"
                  style={{ padding: '1rem 1.1rem', textAlign: 'left' }}
                >
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h2>
                  <div
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      opacity: row.body?.trim() ? 0.92 : 0.45,
                    }}
                  >
                    {body}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ActivityPage;
