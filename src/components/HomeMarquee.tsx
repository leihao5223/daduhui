import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/http';
import { homeContent } from '../content/home';

/**
 * 首页公告走马灯：文案来自管理后台 CMS（/api/cms/home-marquee）。
 */
const HomeMarquee: React.FC = () => {
  const [text, setText] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await apiGet<{ success?: boolean; enabled?: boolean; text?: string }>('/api/cms/home-marquee');
        if (cancelled) return;
        const t = String(r.text || '').trim();
        if (r.success && r.enabled !== false && t) {
          setText(t);
          setShow(true);
        } else {
          setShow(false);
        }
      } catch {
        if (!cancelled) setShow(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const durationSec = useMemo(() => {
    const n = text.length;
    return Math.min(72, Math.max(16, n * 0.14));
  }, [text.length]);

  if (!show) return null;

  return (
    <section className="home-marquee" aria-label={homeContent.marqueeAria}>
      <div className="home-marquee__badge">{homeContent.marqueeBadge}</div>
      <div className="home-marquee__track">
        <div className="home-marquee__strip" style={{ animationDuration: `${durationSec}s` }}>
          <span className="home-marquee__text">{text}</span>
          <span className="home-marquee__text" aria-hidden>
            {text}
          </span>
        </div>
      </div>
    </section>
  );
};

export default HomeMarquee;
