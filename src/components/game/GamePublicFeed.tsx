import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '../../api/http';

export type GameFeedItem = {
  id: string;
  role: string;
  nickname?: string;
  userId?: string;
  botName?: string;
  verified?: boolean;
  text: string;
  createdAt: string;
};

type Props = {
  apiPath: string;
  title: string;
  emptyLabel: string;
  /** 展示在公屏上方的预选文案（如下注前同步展示） */
  previewLine?: string | null;
  previewCaption?: string;
};

export const GamePublicFeed: React.FC<Props> = ({ apiPath, title, emptyLabel, previewLine, previewCaption }) => {
  const [rows, setRows] = useState<GameFeedItem[]>([]);
  const lastIdRef = useRef('');
  const boxRef = useRef<HTMLDivElement>(null);

  const mergeTail = useCallback((incoming: GameFeedItem[]) => {
    if (!incoming.length) return;
    setRows((prev) => {
      const ids = new Set(prev.map((x) => x.id));
      const add = incoming.filter((x) => !ids.has(x.id));
      if (!add.length) return prev;
      const merged = [...prev, ...add];
      lastIdRef.current = merged[merged.length - 1].id;
      return merged;
    });
  }, []);

  const tick = useCallback(async () => {
    try {
      if (!lastIdRef.current) {
        const r = await apiGet<{ success?: boolean; list?: GameFeedItem[] }>(apiPath);
        const list = Array.isArray(r.list) ? r.list : [];
        setRows(list);
        lastIdRef.current = list.length ? list[list.length - 1].id : '';
        return;
      }
      const path = `${apiPath}?after=${encodeURIComponent(lastIdRef.current)}`;
      const r = await apiGet<{ success?: boolean; list?: GameFeedItem[] }>(path);
      const incoming = Array.isArray(r.list) ? r.list : [];
      mergeTail(incoming);
    } catch {
      /* keep last rows */
    }
  }, [apiPath, mergeTail]);

  useEffect(() => {
    lastIdRef.current = '';
    setRows([]);
    let stop = false;
    void (async () => {
      if (stop) return;
      await tick();
    })();
    const id = window.setInterval(() => {
      if (!stop) void tick();
    }, 2800);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [apiPath, tick]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [rows]);

  return (
    <section className="game-public-feed" aria-label={title}>
      <header className="game-public-feed__head">{title}</header>
      {previewLine ? (
        <div className="game-public-feed__preview">
          <span className="game-public-feed__preview-k">{previewCaption}</span>
          <code className="game-public-feed__preview-v">{previewLine}</code>
        </div>
      ) : null}
      <div ref={boxRef} className="game-public-feed__scroll">
        {rows.length === 0 ? (
          <p className="game-public-feed__empty">{emptyLabel}</p>
        ) : (
          rows.map((row) => {
            const isBot = row.role === 'robot';
            return (
              <div key={row.id} className={`game-public-feed__row ${isBot ? 'game-public-feed__row--bot' : ''}`}>
                <div className="game-public-feed__meta">
                  {isBot ? (
                    <span className="game-public-feed__name">
                      <span className="game-public-feed__badge" title="投注助手">
                        ✓
                      </span>
                      {row.botName || '系统'}
                    </span>
                  ) : (
                    <span className="game-public-feed__name">{row.nickname || '用户'}</span>
                  )}
                  <time className="game-public-feed__time">{new Date(row.createdAt).toLocaleString('zh-CN')}</time>
                </div>
                <div className="game-public-feed__bubble">{row.text}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
