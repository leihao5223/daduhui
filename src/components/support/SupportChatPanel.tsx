import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSupportChat } from '../../context/SupportChatContext';
import { apiGet, apiPost } from '../../api/http';
import { getToken } from '../../lib/auth';

type ServerMsg = { id: string; role: 'user' | 'admin' | 'system'; text: string; createdAt: string };

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
}

function mapServer(m: ServerMsg): Message {
  return {
    id: m.id,
    type: m.role === 'admin' ? 'agent' : m.role === 'system' ? 'system' : 'user',
    content: m.text,
    timestamp: new Date(m.createdAt).getTime(),
  };
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [bootErr, setBootErr] = useState<string | null>(null);
  const [fabOffset, setFabOffset] = useState(() =>
    typeof window !== 'undefined' ? readStoredFabOffset() : { x: 0, y: 0 },
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
  const pollRef = useRef<number | null>(null);
  const lastIdRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const mergeIncoming = useCallback((incoming: ServerMsg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const sm of incoming) {
        const m = mapServer(sm);
        map.set(m.id, m);
      }
      return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
    });
    const last = incoming[incoming.length - 1];
    if (last) lastIdRef.current = last.id;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (!getToken()) {
      setBootErr('请先登录后再使用在线客服');
      setMessages([
        {
          id: 'sys-login',
          type: 'system',
          content: '请先登录账号，以便客服关联您的账户与资金问题。',
          timestamp: Date.now(),
        },
      ]);
      setSessionId(null);
      return;
    }
    setBootErr(null);
    let cancelled = false;
    (async () => {
      try {
        const r = await apiPost<{ success?: boolean; sessionId?: string; messages?: ServerMsg[] }>(
          '/api/me/support/session',
          {},
        );
        if (cancelled) return;
        if (!r.success || !r.sessionId) {
          setBootErr('无法建立客服会话');
          return;
        }
        setSessionId(r.sessionId);
        const initial = Array.isArray(r.messages) ? r.messages : [];
        if (initial.length) {
          setMessages(initial.map(mapServer));
          lastIdRef.current = initial[initial.length - 1].id;
        } else {
          setMessages([]);
        }
      } catch (e: unknown) {
        if (!cancelled) setBootErr(e instanceof Error ? e.message : '连接失败');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !sessionId || !getToken()) return;
    const poll = async () => {
      try {
        const after = lastIdRef.current;
        const qs = after
          ? `sessionId=${encodeURIComponent(sessionId)}&after=${encodeURIComponent(after)}`
          : `sessionId=${encodeURIComponent(sessionId)}`;
        const r = await apiGet<{ success?: boolean; messages?: ServerMsg[] }>(`/api/me/support/messages?${qs}`);
        if (r.success && Array.isArray(r.messages) && r.messages.length) {
          mergeIncoming(r.messages);
        }
      } catch {
        /* 轮询失败忽略 */
      }
    };
    void poll();
    pollRef.current = window.setInterval(() => void poll(), 3000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [isOpen, sessionId, mergeIncoming]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || sending) return;
      if (!getToken()) return;
      if (!sessionId) {
        window.alert('会话未就绪，请稍后再试');
        return;
      }
      const text = content.trim();
      const optimistic: Message = {
        id: `local-${Date.now()}`,
        type: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      setSending(true);
      try {
        await apiPost('/api/me/support/messages', { sessionId, text });
        const r = await apiGet<{ success?: boolean; messages?: ServerMsg[] }>(
          `/api/me/support/messages?sessionId=${encodeURIComponent(sessionId)}`,
        );
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        if (r.success && Array.isArray(r.messages)) {
          setMessages(r.messages.map(mapServer));
          if (r.messages.length) lastIdRef.current = r.messages[r.messages.length - 1].id;
        }
      } catch (e: unknown) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        window.alert(e instanceof Error ? e.message : '发送失败');
      } finally {
        setSending(false);
      }
    },
    [sending, sessionId, mergeIncoming],
  );

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  useEffect(() => {
    if (isOpen && prefillMessage && autoSend && getToken() && sessionId) {
      const t = window.setTimeout(() => {
        void handleSendMessageRef.current(prefillMessage);
      }, 120);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [isOpen, prefillMessage, autoSend, sessionId]);

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
    [fabOffset.x, fabOffset.y],
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
    [openChat],
  );

  const canSend = Boolean(getToken() && sessionId && !bootErr);

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
                <p className="dx-support-panel__sub">大都汇 · 人工客服</p>
                <p className="dx-support-panel__sub dx-support-panel__sub--status">
                  <span className="dx-support-online-dot" aria-hidden />
                  {sessionId ? '已连接' : bootErr ? '未连接' : '连接中…'}
                </p>
              </div>
              <div className="dx-support-panel__hd-actions">
                <button type="button" className="dx-support-close" aria-label="关闭" onClick={closeChat}>
                  <X size={18} strokeWidth={1.5} style={{ display: 'block' }} />
                </button>
              </div>
            </div>

            <div className="dx-support-panel__body">
              {bootErr ? (
                <p className="dx-support-msg dx-support-msg--sys">{bootErr}</p>
              ) : null}
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
                      className={['dx-support-bubble', mine ? 'dx-support-bubble--mine' : 'dx-support-bubble--staff']
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
                  className="dx-support-input"
                  type="text"
                  enterKeyHint="send"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={canSend ? '输入消息…' : '登录后可发消息'}
                  disabled={sending || !canSend}
                  autoComplete="off"
                />
                <button type="submit" className="dx-support-send" disabled={sending || !canSend || !input.trim()}>
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
