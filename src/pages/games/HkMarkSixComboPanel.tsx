import React, { useMemo, useState, useEffect } from 'react';
import {
  hkComboModes,
  buildComboKey,
  type ComboModeId,
  zodiacMeta,
} from '../../games/hkMarkSix/playCatalog';

function maxPicksFor(mode: ComboModeId): number {
  if (mode.startsWith('lm-')) {
    if (mode === 'lm-sz2' || mode === 'lm-sz3') return 3;
    return 2;
  }
  if (mode.startsWith('bz-')) return Number(mode.split('-')[1]);
  if (mode.startsWith('szl-')) return Number(mode.charAt(4));
  if (mode.startsWith('wl-')) return Number(mode.charAt(4));
  return 6;
}

function needsNumbers(mode: ComboModeId): boolean {
  return mode.startsWith('lm-') || mode.startsWith('bz-');
}

function needsZodiac(mode: ComboModeId): boolean {
  return mode.startsWith('szl-') || mode.startsWith('sixz-');
}

function needsTail(mode: ComboModeId): boolean {
  return mode.startsWith('wl-');
}

type Props = {
  onAddKey: (key: string) => void;
  existingKeys: Set<string>;
  labels: { mode: string; add: string; clear: string; pickMore: (n: number) => string };
};

const NUMS = Array.from({ length: 49 }, (_, i) => String(i + 1).padStart(2, '0'));

export const HkMarkSixComboPanel: React.FC<Props> = ({ onAddKey, existingKeys, labels }) => {
  const [mode, setMode] = useState<ComboModeId>('lm-sz2');
  const [picks, setPicks] = useState<string[]>([]);

  useEffect(() => {
    setPicks([]);
  }, [mode]);

  const hint = useMemo(() => hkComboModes.find((m) => m.id === mode)?.hint ?? '', [mode]);
  const max = useMemo(() => maxPicksFor(mode), [mode]);

  const toggle = (p: string) => {
    setPicks((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= max) return prev;
      return [...prev, p];
    });
  };

  const handleAdd = () => {
    const key = buildComboKey(mode, picks);
    if (!key) {
      window.alert(labels.pickMore(max));
      return;
    }
    if (existingKeys.has(key)) {
      window.alert('该组合已在注单中');
      return;
    }
    onAddKey(key);
    setPicks([]);
  };

  return (
    <div className="hk6-combo">
      <div className="hk6-combo-row">
        <label className="hk6-combo-label" htmlFor="hk6-combo-mode">
          {labels.mode}
        </label>
        <select
          id="hk6-combo-mode"
          className="hk6-combo-select"
          value={mode}
          onChange={(e) => setMode(e.target.value as ComboModeId)}
        >
          {hkComboModes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <p className="hk6-combo-hint">{hint}</p>
      <p className="hk6-combo-count">
        已选 {picks.length}/{max}
      </p>

      {needsNumbers(mode) ? (
        <div className="hk6-combo-grid hk6-combo-grid--nums">
          {NUMS.map((n) => {
            const on = picks.includes(n);
            return (
              <button
                key={n}
                type="button"
                className={`hk6-combo-cell ${on ? 'hk6-combo-cell--on' : ''}`}
                onClick={() => toggle(n)}
              >
                {n}
              </button>
            );
          })}
        </div>
      ) : null}

      {needsZodiac(mode) ? (
        <div className="hk6-combo-zodiac">
          {zodiacMeta.map((z) => {
            const on = picks.includes(z.id);
            return (
              <button
                key={z.id}
                type="button"
                className={`hk6-combo-zbtn ${on ? 'hk6-combo-zbtn--on' : ''}`}
                onClick={() => toggle(z.id)}
              >
                {z.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {needsTail(mode) ? (
        <div className="hk6-combo-tails">
          {Array.from({ length: 10 }, (_, d) => {
            const s = String(d);
            const on = picks.includes(s);
            return (
              <button
                key={d}
                type="button"
                className={`hk6-combo-tbtn ${on ? 'hk6-combo-tbtn--on' : ''}`}
                onClick={() => toggle(s)}
              >
                {d}尾
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="hk6-combo-actions">
        <button type="button" className="hk6-combo-add" onClick={handleAdd}>
          {labels.add}
        </button>
        <button type="button" className="hk6-combo-clear" onClick={() => setPicks([])}>
          {labels.clear}
        </button>
      </div>
    </div>
  );
};
