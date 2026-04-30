import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Headphones, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { useSupportChat } from '../../context/SupportChatContext';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
}

const FAB_POS_KEY = 'ddh-support-fab-offset-v1';

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

export default function SupportChatPanel() {
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

  const handleSendMessage = useCallback(async (content: string) => {
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

    setTimeout(() => {
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        content: '您好，已收到您的消息，客服专员正在处理，请稍候...',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setSending(false);
    }, 1000);
  }, [sending]);

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  useEffect(() => {
    if (isOpen && prefillMessage && autoSend) {
      setInput(prefillMessage);
      const t = setTimeout(() => {
        void handleSendMessageRef.current(prefillMessage);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isOpen, prefillMessage, autoSend]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const onResize = () => {
      setFabOffset((o) => {
        const c = clampFabOffset(o.x, o.y);
        try {
          sessionStorage.setItem(FAB_POS_KEY, JSON.stringify(c));
        } catch {}
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

  const onFabPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
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
  }, [fabOffset.x, fabOffset.y]);

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
    } catch {}
    fabDragRef.current = null;
    setFabOffset((o) => {
      const c = clampFabOffset(o.x, o.y);
      try {
        sessionStorage.setItem(FAB_POS_KEY, JSON.stringify(c));
      } catch {}
      return c;
    });
  }, []);

  const onFabClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (fabDidDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      fabDidDragRef.current = false;
      return;
    }
    openChat();
  }, [openChat]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={closeChat}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed right-4 bottom-24 w-[380px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">在线客服</h2>
                    <div className="flex items-center gap-1 text-primary-100 text-xs">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      客服在线中
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeChat}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="h-[320px] overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg) => {
                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="inline-block px-3 py-1.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  const mine = msg.type === 'user';
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${mine ? 'text-right' : ''}`}>
                        <div
                          className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                            mine
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-slate-700 shadow-sm border border-slate-100'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`text-xs text-slate-400 mt-1 ${mine ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 p-3 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入消息..."
                    disabled={sending}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                  <button
                    type="button"
                    className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  客服工作时间：7×24小时在线
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed right-4 bottom-24 z-40"
          style={{ transform: `translate(${fabOffset.x}px, ${fabOffset.y}px)` }}
        >
          <button
            type="button"
            onPointerDown={onFabPointerDown}
            onPointerMove={onFabPointerMove}
            onPointerUp={onFabPointerUp}
            onPointerCancel={onFabPointerUp}
            onClick={onFabClick}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all cursor-move"
          >
            <Headphones className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </>
  );
}
