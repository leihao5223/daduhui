import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  gapPercent: number;
  value: number;
  onChange: (pct: number) => void;
  disabled?: boolean;
  hint?: string;
};

/**
 * 真人验证：上方轨道展示缺口位置，下方拖动「拼图块」对齐（value 为 0–100 的中心位置百分比）。
 */
export const SlideImageHumanCaptcha: React.FC<Props> = ({ gapPercent, value, onChange, disabled, hint }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clampPct = useCallback((raw: number) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }, []);

  const clientXToPct = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const r = el.getBoundingClientRect();
      if (r.width <= 1) return value;
      const x = clientX - r.left;
      return clampPct((x / r.width) * 100);
    },
    [clampPct, value],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(clientXToPct(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    onChange(clientXToPct(e.clientX));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragging.current) {
      dragging.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const g = clampPct(gapPercent);
  const v = clampPct(value);

  return (
    <div className="slide-human">
      {hint ? <p className="slide-human__hint">{hint}</p> : null}
      <p className="slide-human__label">缺口位置（参考）</p>
      <div className="slide-human__rail slide-human__rail--ghost" aria-hidden>
        <div className="slide-human__track-bg" />
        <div className="slide-human__gap" style={{ left: `${g}%` }} />
      </div>
      <p className="slide-human__label">拖动拼图对齐缺口</p>
      <div
        ref={trackRef}
        className="slide-human__rail"
        onPointerDown={(e) => {
          if (disabled) return;
          onChange(clientXToPct(e.clientX));
        }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-label="拖动拼图块对齐缺口"
      >
        <div className="slide-human__track-bg" />
        <div className="slide-human__gap slide-human__gap--dim" style={{ left: `${g}%` }} />
        <button
          type="button"
          className="slide-human__piece"
          style={{ left: `${v}%` }}
          disabled={disabled}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-label="拼图块"
        >
          <span className="slide-human__chev">››</span>
        </button>
      </div>
    </div>
  );
};
