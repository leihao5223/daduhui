import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../api/http';
import { getToken } from '../../lib/auth';
import '../../styles/hk-marksix-game.css';
import { gamesContent } from '../../content/games';

const QUICK_STAKES = [10, 20, 50, 100, 200];
const t = gamesContent.speed;

const SPEED_OPTIONS: { cat: string; playTypes: { id: string; name: string; options: { key: string; label: string; odds: string }[] }[] }[] = [
  {
    cat: 'dx',
    playTypes: [
      {
        id: 'dx',
        name: t.catDx,
        options: [
          { key: 'speed:dx:big', label: '大', odds: '1.95' },
          { key: 'speed:dx:small', label: '小', odds: '1.95' },
        ],
      },
    ],
  },
  {
    cat: 'ds',
    playTypes: [
      {
        id: 'ds',
        name: t.catDs,
        options: [
          { key: 'speed:ds:odd', label: '单', odds: '1.95' },
          { key: 'speed:ds:even', label: '双', odds: '1.95' },
        ],
      },
    ],
  },
];

type SpeedStatus = {
  success?: boolean;
  currentPeriod?: string;
  countdownSec?: number;
  cycleSec?: number;
  lastDraw?: { period?: string; ranking?: number[]; champion?: number; drawnAt?: string };
};

const SpeedRacingGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState(SPEED_OPTIONS[0]?.cat ?? 'dx');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [unitAmount, setUnitAmount] = useState(10);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [status, setStatus] = useState<SpeedStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [historyRows, setHistoryRows] = useState<{ period: string; nums: string; champion?: number; time: string }[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betting, setBetting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [flow, setFlow] = useState<number | null>(null);
  const [pnl, setPnl] = useState<number | null>(null);

  const activeBlocks = useMemo(() => SPEED_OPTIONS.find((x) => x.cat === activeCat)?.playTypes ?? [], [activeCat]);

  const refreshBalance = useCallback(async () => {
    if (!getToken()) {
      setBalance(null);
      setFlow(null);
      setPnl(null);
      return;
    }
    try {
      const r = await apiGet<{
        success?: boolean;
        data?: { available?: number; speedTurnover?: number; speedPnl?: number };
      }>('/api/me/summary');
      if (r.success && r.data) {
        if (typeof r.data.available === 'number') setBalance(r.data.available);
        setFlow(typeof r.data.speedTurnover === 'number' ? r.data.speedTurnover : null);
        setPnl(typeof r.data.speedPnl === 'number' ? r.data.speedPnl : null);
      }
    } catch {
      setBalance(null);
      setFlow(null);
      setPnl(null);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    let cancelled = false;
    const timerRef: { id: number | null } = { id: null };
    async function poll() {
      if (cancelled) return;
      try {
        const s = await apiGet<SpeedStatus>('/api/game/speed-racing/status', { timeout: 15000 });
        if (!cancelled) {
          setStatus(s);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
          setFailed(true);
        }
      } finally {
        if (!cancelled) timerRef.id = window.setTimeout(poll, 2000);
      }
    }
    void poll();
    return () => {
      cancelled = true;
      if (timerRef.id != null) window.clearTimeout(timerRef.id);
    };
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    let cancelled = false;
    setHistoryLoading(true);
    void (async () => {
      try {
        const r = await apiGet<{
          success?: boolean;
          list?: { period: string; nums: string; champion?: number; time: string }[];
        }>('/api/game/speed-racing/history?limit=100');
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

  const toggle = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }, []);

  const nSel = selectedKeys.size;
  const total = nSel * unitAmount;

  const handleBet = async () => {
    if (!getToken()) {
      window.alert(t.alertLogin);
      return;
    }
    if (!nSel) {
      window.alert(t.alertNoSelection);
      return;
    }
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      window.alert(t.alertBadStake);
      return;
    }
    setBetting(true);
    try {
      const lines = Array.from(selectedKeys).map((key) => ({ key, stake: unitAmount }));
      const data = await apiPost<{ success?: boolean; message?: string }>('/api/game/speed-racing/bet', {
        lines,
        totalAmount: total,
      });
      if (data.success) {
        window.alert(t.betSuccess(total.toFixed(2)));
        setSelectedKeys(new Set());
        void refreshBalance();
      } else {
        window.alert(data.message || t.betFail);
      }
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : t.networkError);
    } finally {
      setBetting(false);
    }
  };

  return (
    <div className="hk6-game">
      <header className="hk6-row1">
        <div className="hk6-row1-left">
          <button type="button" className="hk6-back" onClick={() => navigate(-1)} aria-label={t.ariaBack}>
            ←
          </button>
          <div className="hk6-title-block">
            <h1 className="hk6-title">{t.title}</h1>
            <p className="hk6-sub">
              {status?.currentPeriod
                ? t.subtitle(status.currentPeriod, status.countdownSec ?? '—', status.cycleSec ?? 75)
                : failed
                  ? t.statusApiError
                  : t.subtitleLoading}
            </p>
            <p style={{ fontSize: 12, opacity: 0.75, margin: '4px 0 0' }}>{t.note}</p>
          </div>
        </div>
        <div className="hk6-stats">
          <span>
            {t.statsBalance} <b>{balance != null ? balance.toFixed(2) : '—'}</b>
          </span>
          <span>
            {t.statsFlow} <b>{flow != null ? flow.toFixed(2) : '—'}</b>
          </span>
          <span>
            {t.statsPnl} <b>{pnl != null ? pnl.toFixed(2) : '—'}</b>
          </span>
        </div>
      </header>

      <section className="hk6-row2" aria-label={t.row2Aria}>
        <div className="hk6-prev-draw">
          <div>
            {t.prevDraw} <strong>{status?.lastDraw?.period ?? '—'}</strong>
          </div>
          <div style={{ marginTop: 8 }}>
            {t.champ}：<strong>{status?.lastDraw?.champion ?? '—'}</strong>
          </div>
          <div className="hk6-balls" style={{ flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {status?.lastDraw?.ranking?.length ? (
              status.lastDraw.ranking.map((num, i) => (
                <div key={`${i}-${num}`} className="hk6-ball-wrap">
                  <span className="hk6-ball hk6-ball--b" style={{ fontSize: 12 }}>
                    {i + 1}:{num}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ opacity: 0.5 }}>{t.noDraw}</span>
            )}
          </div>
        </div>
        <button type="button" className="hk6-history-btn" onClick={() => setHistoryOpen(true)}>
          {t.historyBtn}
        </button>
      </section>

      <section className="hk6-bet-plate" aria-label={t.betPlateAria}>
        <aside className="hk6-sidebar">
          {SPEED_OPTIONS.map((b) => (
            <button
              key={b.cat}
              type="button"
              className={`hk6-cat-btn ${b.cat === activeCat ? 'hk6-cat-btn--active' : ''}`}
              onClick={() => setActiveCat(b.cat)}
            >
              {b.cat === 'dx' ? t.catDx : t.catDs}
            </button>
          ))}
        </aside>
        <div className="hk6-options-pane">
          {activeBlocks.map((pt) => (
            <section key={pt.id} className="hk6-play-section">
              <header className="hk6-play-head">
                <span>{pt.name}</span>
              </header>
              <div className="hk6-option-grid">
                {pt.options.map((opt) => {
                  const on = selectedKeys.has(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`hk6-option-cell ${on ? 'hk6-option-cell--on' : ''}`}
                      onClick={() => toggle(opt.key)}
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

      <section className="hk6-row4" aria-label={t.summaryAria}>
        <span>
          {t.betSummary}：<strong>¥{total.toFixed(2)}</strong>
        </span>
        <span>
          {t.totalTicketsPrefix} <strong>{nSel}</strong> {t.totalTicketsSuffix}
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
            min={1}
            step={1}
            value={unitAmount}
            onChange={(e) => setUnitAmount(Number(e.target.value) || 0)}
            aria-label={t.stakeInputAria}
          />
          <button type="button" className="hk6-btn-bet" onClick={() => void handleBet()} disabled={betting}>
            {betting ? t.betting : t.bet}
          </button>
          <button type="button" className="hk6-btn-reset" onClick={() => setSelectedKeys(new Set())}>
            {t.reset}
          </button>
        </div>
      </footer>

      {historyOpen ? (
        <div className="hk6-modal-back" role="dialog" aria-modal="true" onClick={() => setHistoryOpen(false)}>
          <div className="hk6-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.historyTitle}</h3>
            <div className="hk6-modal-list">
              {historyLoading ? (
                <div className="hk6-modal-row">{t.historyLoading}</div>
              ) : historyRows.length === 0 ? (
                <div className="hk6-modal-row">{t.historyEmpty}</div>
              ) : (
                historyRows.map((row) => (
                  <div key={`${row.period}-${row.time}`} className="hk6-modal-row">
                    <span>{row.period}</span>
                    <span>
                      {t.champ}:{row.champion ?? '—'} · {row.nums}
                    </span>
                    <span>{row.time}</span>
                  </div>
                ))
              )}
            </div>
            <button type="button" className="hk6-modal-close" onClick={() => setHistoryOpen(false)}>
              {t.close}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SpeedRacingGamePage;
