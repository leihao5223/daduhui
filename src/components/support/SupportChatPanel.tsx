import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSupportChat } from '../../context/SupportChatContext';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
}

function HeadsetIcon() {
  return (
    <svg className="dx-support-fab__svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14v3a2 2 0 002 2h1v-7H6a2 2 0 00-2 2zm16-1v4a2 2 0 01-2 2h-1v-8h1a2 2 0 012 2z"
        fill="currentColor"
      />
      <path
        d="M7 12v8a1 1 0 001 1h1a3 3 0 003-3v-1.5M17 12v8a1 1 0 01-1 1h-1a3 3 0 01-3-3v-1.5M8 10V7a4 4 0 118 0v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FAB_POS_KEY = 'dx-support-fab-offset-v1';

function readStoredFabOffset(): { x: number; y: number } {
  try {
    const raw = sessionStorage.getItem(FAB_POS_KEY);
    if (!raw) return { x: 0, y: 0 };
    const j = JSON.parse(raw) as { x?: number; y?: number };
    const x = Number(j.x);
    const y = Number(j.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
    return { x, y };
  } catch {
    return { x: 0, y: 0 };
  }
}

function clampFabOffset(x: number, y: number) {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fab = 56;
  const pad = 10;
  const minX = -(vw - fab - pad * 2);
  const maxX = 0;
  const minY = -(vh - fab - 120);
  const maxY = Math.min(100, vh * 0.25);
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

export const SupportChatPanel: React.FC = () => {
  const { isOpen, prefillMessage, autoSend, openChat, closeChat } = useSupportChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [fabOffset, setFabOffset] = useState(() =>
    typeof window !== 'undefined' ? readStoredFabOffset() : { x: 0, y: 0 }
  );
  const fabDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const fabDidDragRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: 'welcome',
          type: 'system',
          content: '欢迎使用大都汇客服系统，请问有什么可以帮助您的？',
          timestamp: Date.now(),
        },
      ];
    });
  }, [isOpen]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || sending) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setSending(true);

      window.setTimeout(() => {
        const agentMsg: Message = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: '您好，已收到您的消息，客服专员正在处理，请稍候…',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, agentMsg]);
        setSending(false);
      }, 1000);
    },
    [sending]
  );

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  useEffect(() => {
    if (isOpen && prefillMessage && autoSend) {
      setInput(prefillMessage);
      const t = window.setTimeout(() => {
        void handleSendMessageRef.current(prefillMessage);
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, prefillMessage, autoSend]);

  useEffect(() => {
    const onResize = () => {
      setFabOffset((o) => {
        const c = clampFabOffset(o.x, o.y);
        try {
          sessionStorage.setItem(FAB_POS_KEY, JSON.stringify(c));
        } catch {
          /* ignore */
        }
        return c;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSendMessage(input);
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  const onFabPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      fabDidDragRef.current = false;
      fabDragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: fabOffset.x,
        originY: fabOffset.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [fabOffset.x, fabOffset.y]
  );

  const onFabPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 5) fabDidDragRef.current = true;
    setFabOffset(clampFabOffset(d.originX + dx, d.originY + dy));
  }, []);

  const onFabPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    fabDragRef.current = null;
    setFabOffset((o) => {
      const c = clampFabOffset(o.x, o.y);
      try {
        sessionStorage.setItem(FAB_POS_KEY, JSON.stringify(c));
      } catch {
        /* ignore */
      }
      return c;
    });
  }, []);

  const onFabClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (fabDidDragRef.current) {
        e.preventDefault();
        e.stopPropagation();
        fabDidDragRef.current = false;
        return;
      }
      openChat();
    },
    [openChat]
  );

  return (
    <>
      {isOpen && (
        <>
          <button type="button" className="dx-support-backdrop" aria-label="关闭客服窗口" onClick={closeChat} />
          <div className="dx-support-panel dx-support-panel--open" aria-hidden={false} role="dialog" aria-modal="true">
            <div className="dx-support-panel__grab" aria-hidden>
              <span className="dx-support-panel__grab-bar" />
            </div>
            <div className="dx-support-panel__hd">
              <div>
                <h2 className="dx-support-panel__title">在线客服</h2>
                <p className="dx-support-panel__sub">大都汇 · 智能与人工服务</p>
                <p className="dx-support-panel__sub dx-support-panel__sub--status">
                  <span className="dx-support-online-dot" aria-hidden />
                  在线
                </p>
              </div>
              <div className="dx-support-panel__hd-actions">
                <button type="button" className="dx-support-close" aria-label="关闭" onClick={closeChat}>
                  <X size={18} strokeWidth={1.5} style={{ display: 'block' }} />
                </button>
              </div>
            </div>

            <div className="dx-support-panel__body">
              {messages.map((msg) => {
                if (msg.type === 'system') {
                  return (
                    <p key={msg.id} className="dx-support-msg dx-support-msg--sys">
                      {msg.content}
                    </p>
                  );
                }
                const mine = msg.type === 'user';
                return (
                  <div
                    key={msg.id}
                    className={['dx-support-row', mine ? 'dx-support-row--mine' : ''].filter(Boolean).join(' ')}
                  >
                    <div
                      className={[
                        'dx-support-bubble',
                        mine ? 'dx-support-bubble--mine' : 'dx-support-bubble--staff',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <p>{msg.content}</p>
                      <time className="dx-support-time">{formatTime(msg.timestamp)}</time>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="dx-support-panel__ft">
              <form onSubmit={handleSubmit} className="dx-support-panel__row">
                <input
                  ref={inputRef}
                  className="dx-support-input"
                  type="text"
                  enterKeyHint="send"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="点击输入消息…"
                  disabled={sending}
                  autoComplete="off"
                />
                <button type="submit" className="dx-support-send" disabled={sending || !input.trim()}>
                  发送
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {!isOpen && (
        <div
          className="dx-support-fab-wrap"
          style={{ transform: `translate(${fabOffset.x}px, ${fabOffset.y}px)` }}
        >
          <button
            type="button"
            className="dx-support-fab dx-support-fab--draggable"
            aria-label="拖动或打开在线客服"
            onPointerDown={onFabPointerDown}
            onPointerMove={onFabPointerMove}
            onPointerUp={onFabPointerUp}
            onPointerCancel={onFabPointerUp}
            onClick={onFabClick}
          >
            <HeadsetIcon />
          </button>
        </div>
      )}
    </>
  );
};
