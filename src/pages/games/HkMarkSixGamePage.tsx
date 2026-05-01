import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hkMarkSixPlayCatalog, lineKey } from '../../games/hkMarkSix/playCatalog';
import { apiGet, apiPost } from '../../api/http';
import { getToken } from '../../lib/auth';
import '../../styles/hk-marksix-game.css';
import { gamesContent } from '../../content/games';

type Hk6Status = {
  success?: boolean;
  currentPeriod?: string;
  countdownSec?: number;
  lastDraw?: {
    period?: string;
    balls?: string[];
    special?: string;
    drawnAt?: string;
  };
};

type Hk6HistoryRow = {
  period: string;
  balls: string;
  time: string;
};

function ballTone(num: string): 'r' | 'b' | 'g' {
  const k = Number(num) || 0;
  const m = k % 3;
  if (m === 0) return 'r';
  if (m === 1) return 'b';
  return 'g';
}

const QUICK_STAKES = [10, 20, 50, 100, 200];
const hk = gamesContent.hk6;

const HkMarkSixGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState(hkMarkSixPlayCatalog[0]?.id ?? '');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [unitAmount, setUnitAmount] = useState(10);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [status, setStatus] = useState<Hk6Status | null>(null);
  const [historyRows, setHistoryRows] = useState<Hk6HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betting, setBetting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const activeCategory = useMemo(
    () => hkMarkSixPlayCatalog.find((c) => c.id === activeCategoryId),
    [activeCategoryId],
  );

  const refreshBalance = useCallback(async () => {
    if (!getToken()) {
      setBalance(null);
      return;
    }
    try {
      const r = await apiGet<{ success?: boolean; data?: { available?: number } }>('/api/me/summary');
      if (r.success && r.data && typeof r.data.available === 'number') {
        setBalance(r.data.available);
      }
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const s = await apiGet<Hk6Status>('/api/game/hk-marksix/status');
        if (!cancelled) setStatus(s);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }
    void tick();
    const id = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    let cancelled = false;
    setHistoryLoading(true);
    void (async () => {
      try {
        const r = await apiGet<{ success?: boolean; list?: Hk6HistoryRow[] }>(
          '/api/game/hk-marksix/history?limit=30',
        );
        if (!cancelled && r.success && Array.isArray(r.list)) setHistoryRows(r.list);
      } catch {
        if (!cancelled) setHistoryRows([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyOpen]);

  const toggleOption = useCallback((playTypeId: string, optionId: string) => {
    const k = lineKey(playTypeId, optionId);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const selectedCount = selectedKeys.size;
  const totalStake = selectedCount * unitAmount;

  const lastDrawBalls = useMemo(() => {
    const ld = status?.lastDraw;
    if (!ld || !Array.isArray(ld.balls)) return [];
    const main = ld.balls.map((n) => ({ n, tone: ballTone(n) }));
    const sp = ld.special ? [{ n: ld.special, tone: ballTone(ld.special) }] : [];
    return [...main, ...sp];
  }, [status?.lastDraw]);

  const handleReset = () => {
    setSelectedKeys(new Set());
  };

  const handleBet = async () => {
    if (!getToken()) {
      window.alert(hk.alertLogin);
      navigate('/');
      return;
    }
    if (selectedCount === 0) {
      window.alert(hk.alertNoSelection);
      return;
    }
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      window.alert(hk.alertBadStake);
      return;
    }
    setBetting(true);
    try {
      const lines = Array.from(selectedKeys).map((key) => ({ key, stake: unitAmount }));
      const data = await apiPost<{ success?: boolean; message?: string }>('/api/game/hk-marksix/bet', {
        lines,
        totalAmount: totalStake,
      });
      if (data.success) {
        window.alert(hk.betSuccess(totalStake.toFixed(2)));
        setSelectedKeys(new Set());
        void refreshBalance();
      } else {
        window.alert(data.message || hk.betFail);
      }
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : hk.networkError);
    } finally {
      setBetting(false);
    }
  };

  return (
    <div className="hk6-game">
      <header className="hk6-row1">
        <div className="hk6-row1-left">
          <button type="button" className="hk6-back" onClick={() => navigate(-1)} aria-label={hk.ariaBack}>
            ←
          </button>
          <div className="hk6-title-block">
            <h1 className="hk6-title">{hk.title}</h1>
            <p className="hk6-sub">
              {status?.currentPeriod
                ? hk.subtitle(status.currentPeriod, status.countdownSec ?? '—')
                : hk.subtitleLoading}
            </p>
          </div>
        </div>
        <div className="hk6-stats">
          <span>
            {hk.statsBalance} <b>{balance != null ? balance.toFixed(2) : hk.statsDash}</b>
          </span>
          <span>
            {hk.statsFlow} <b>{hk.statsDash}</b>
          </span>
          <span>
            {hk.statsPnl} <b>{hk.statsDash}</b>
          </span>
          <span>
            {hk.statsRebate} <b>{hk.statsDash}</b>
          </span>
        </div>
      </header>

      <section className="hk6-row2" aria-label={hk.row2Aria}>
        <div className="hk6-prev-draw">
          <div>
            {hk.prevDraw} <strong>{status?.lastDraw?.period ?? '—'}</strong>
          </div>
          <div className="hk6-balls">
            {lastDrawBalls.length ? (
              lastDrawBalls.map(({ n, tone }, i) => (
                <span key={`${i}-${n}`} className={`hk6-ball hk6-ball--${tone}`}>
                  {n}
                </span>
              ))
            ) : (
              <span style={{ opacity: 0.5 }}>{hk.noDraw}</span>
            )}
          </div>
        </div>
        <button type="button" className="hk6-history-btn" onClick={() => setHistoryOpen(true)}>
          {hk.historyBtn}
        </button>
      </section>

      <section className="hk6-bet-plate" aria-label={hk.betPlateAria}>
        <aside className="hk6-sidebar">
          {hkMarkSixPlayCatalog.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`hk6-cat-btn ${cat.id === activeCategoryId ? 'hk6-cat-btn--active' : ''}`}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </aside>
        <div className="hk6-options-pane">
          {activeCategory?.playTypes.map((pt) => (
            <section key={pt.id} className="hk6-play-section">
              <header className="hk6-play-head">
                <span>{pt.name}</span>
              </header>
              <div className="hk6-option-grid">
                {pt.options.map((opt) => {
                  const k = lineKey(pt.id, opt.id);
                  const on = selectedKeys.has(k);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`hk6-option-cell ${on ? 'hk6-option-cell--on' : ''}`}
                      onClick={() => toggleOption(pt.id, opt.id)}
                    >
                      <span className="hk6-option-label">{opt.label}</span>
                      <span className="hk6-option-odds">{opt.odds}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="hk6-row4" aria-label={hk.summaryAria}>
        <span>
          {hk.betSummary}：<strong>¥{totalStake.toFixed(2)}</strong>
        </span>
        <span>
          {hk.totalTicketsPrefix} <strong>{selectedCount}</strong> {hk.totalTicketsSuffix}
        </span>
      </section>

      <footer className="hk6-row5">
        <div className="hk6-chips">
          {QUICK_STAKES.map((n) => (
            <button key={n} type="button" className="hk6-chip" onClick={() => setUnitAmount(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="hk6-row5-actions">
          <input
            className="hk6-stake-input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={unitAmount}
            onChange={(e) => setUnitAmount(Number(e.target.value) || 0)}
            aria-label={hk.stakeInputAria}
          />
          <button type="button" className="hk6-btn-bet" onClick={() => void handleBet()} disabled={betting}>
            {betting ? hk.betting : hk.bet}
          </button>
          <button type="button" className="hk6-btn-reset" onClick={handleReset}>
            {hk.reset}
          </button>
        </div>
      </footer>

      {historyOpen ? (
        <div className="hk6-modal-back" role="dialog" aria-modal="true" onClick={() => setHistoryOpen(false)}>
          <div className="hk6-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{hk.historyTitle}</h3>
            <div className="hk6-modal-list">
              {historyLoading ? (
                <div className="hk6-modal-row">{hk.historyLoading}</div>
              ) : historyRows.length === 0 ? (
                <div className="hk6-modal-row">{hk.historyEmpty}</div>
              ) : (
                historyRows.map((row) => (
                  <div key={`${row.period}-${row.time}`} className="hk6-modal-row">
                    <span>{row.period}</span>
                    <span>{row.balls}</span>
                    <span style={{ color: 'rgba(245,243,236,0.45)' }}>{row.time}</span>
                  </div>
                ))
              )}
            </div>
            <button type="button" className="hk6-modal-close" onClick={() => setHistoryOpen(false)}>
              {hk.close}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HkMarkSixGamePage;
