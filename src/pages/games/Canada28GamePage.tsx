import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canada28PlayCatalog } from '../../games/canada28/playCatalog';
import { apiGet, apiPost } from '../../api/http';
import { getToken } from '../../lib/auth';
import '../../styles/hk-marksix-game.css';
import { gamesContent } from '../../content/games';

type Ca28Derived = {
  sum: number;
  digits: string[];
  big?: boolean;
  small?: boolean;
  comboZh?: string | null;
  jiDa?: boolean;
  jiXiao?: boolean;
};

function formatDerived(d: Ca28Derived): string {
  const p: string[] = [];
  p.push(`和值 ${d.sum}`);
  if (d.comboZh) p.push(d.comboZh);
  if (d.jiDa) p.push('极大');
  if (d.jiXiao) p.push('极小');
  return p.join(' · ');
}

type Ca28Status = {
  success?: boolean;
  drawsCount?: number;
  currentPeriod?: string;
  countdownSec?: number;
  cycleSec?: number;
  lastDraw?: {
    period?: string;
    digits?: string[];
    sum?: number;
    drawnAt?: string;
    derived?: Ca28Derived;
  };
  sync?: { enabled?: boolean; url?: string; source?: string | null; at?: string | null; err?: string | null };
};

type Ca28HistoryRow = { period: string; nums: string; sum?: number | null; time: string; derived?: Ca28Derived };

const QUICK_STAKES = [10, 20, 50, 100, 200];
const t = gamesContent.ca28;

const Canada28GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState(canada28PlayCatalog[0]?.id ?? '');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [unitAmount, setUnitAmount] = useState(10);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [status, setStatus] = useState<Ca28Status | null>(null);
  const [statusReqFailed, setStatusReqFailed] = useState(false);
  const [historyRows, setHistoryRows] = useState<Ca28HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betting, setBetting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [flow, setFlow] = useState<number | null>(null);
  const [pnl, setPnl] = useState<number | null>(null);

  const activeCategory = useMemo(
    () => canada28PlayCatalog.find((c) => c.id === activeCategoryId),
    [activeCategoryId],
  );

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
        data?: { available?: number; ca28Turnover?: number; ca28Pnl?: number };
      }>('/api/me/summary');
      if (r.success && r.data) {
        if (typeof r.data.available === 'number') setBalance(r.data.available);
        setFlow(typeof r.data.ca28Turnover === 'number' ? r.data.ca28Turnover : null);
        setPnl(typeof r.data.ca28Pnl === 'number' ? r.data.ca28Pnl : null);
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

    async function pollLoop() {
      if (cancelled) return;
      try {
        const s = await apiGet<Ca28Status>('/api/game/canada-28/status', { timeout: 20000 });
        if (!cancelled) {
          setStatus(s);
          setStatusReqFailed(false);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
          setStatusReqFailed(true);
        }
      } finally {
        if (!cancelled) {
          timerRef.id = window.setTimeout(pollLoop, 2500);
        }
      }
    }

    void pollLoop();
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
        const r = await apiGet<{ success?: boolean; list?: Ca28HistoryRow[] }>(
          '/api/game/canada-28/history?limit=200',
          { timeout: 45000 },
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

  const toggleOption = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectedCount = selectedKeys.size;
  const totalStake = selectedCount * unitAmount;

  const lastDrawSummary = useMemo(() => {
    const der = status?.lastDraw?.derived;
    return der ? formatDerived(der) : null;
  }, [status?.lastDraw?.derived]);

  const handleReset = () => setSelectedKeys(new Set());

  const handleBet = async () => {
    if (!getToken()) {
      window.alert(t.alertLogin);
      navigate('/');
      return;
    }
    if (selectedCount === 0) {
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
      const data = await apiPost<{ success?: boolean; message?: string }>('/api/game/canada-28/bet', {
        lines,
        totalAmount: totalStake,
      });
      if (data.success) {
        window.alert(t.betSuccess(totalStake.toFixed(2)));
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
                ? t.subtitle(status.currentPeriod, status.countdownSec ?? '—', status.cycleSec ?? 210)
                : statusReqFailed
                  ? t.statusApiError
                  : t.subtitleLoading}
              {status?.sync?.source ? (
                <span className="hk6-sync-hint">
                  {' '}
                  · {t.syncSource}: {status.sync.source}
                </span>
              ) : null}
              {status?.sync?.err ? (
                <span className="hk6-sync-hint" style={{ color: '#ffab40' }}>
                  {' '}
                  · {t.syncErr(status.sync.err)}
                </span>
              ) : null}
            </p>
            <p style={{ fontSize: 12, opacity: 0.75, margin: '4px 0 0' }}>{t.sourceHint}</p>
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
            {status?.lastDraw?.sum != null ? (
              <>
                {' '}
                · 和值 <strong>{status.lastDraw.sum}</strong>
              </>
            ) : null}
          </div>
          <div className="hk6-balls" style={{ gap: 8 }}>
            {status?.lastDraw?.digits?.length ? (
              status.lastDraw.digits.map((n, i) => (
                <div key={`${i}-${n}`} className="hk6-ball-wrap">
                  <span className="hk6-ball hk6-ball--g">{n}</span>
                </div>
              ))
            ) : (
              <span style={{ opacity: 0.5 }}>{t.noDraw}</span>
            )}
          </div>
          {lastDrawSummary ? (
            <div className="hk6-draw-derived" title={lastDrawSummary}>
              {lastDrawSummary}
            </div>
          ) : null}
        </div>
        <button type="button" className="hk6-history-btn" onClick={() => setHistoryOpen(true)}>
          {t.historyBtn}
        </button>
      </section>

      <section className="hk6-bet-plate" aria-label={t.betPlateAria}>
        <aside className="hk6-sidebar">
          {canada28PlayCatalog.map((cat) => (
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
              <div
                className="hk6-option-grid"
                style={pt.id === 'tm' ? { gridTemplateColumns: 'repeat(7, minmax(0,1fr))' } : undefined}
              >
                {pt.options.map((opt) => {
                  const on = selectedKeys.has(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`hk6-option-cell ${on ? 'hk6-option-cell--on' : ''}`}
                      onClick={() => toggleOption(opt.key)}
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
          {t.betSummary}：<strong>¥{totalStake.toFixed(2)}</strong>
        </span>
        <span>
          {t.totalTicketsPrefix} <strong>{selectedCount}</strong> {t.totalTicketsSuffix}
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
            aria-label={t.stakeInputAria}
          />
          <button type="button" className="hk6-btn-bet" onClick={() => void handleBet()} disabled={betting}>
            {betting ? t.betting : t.bet}
          </button>
          <button type="button" className="hk6-btn-reset" onClick={handleReset}>
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
                  <div key={`${row.period}-${row.time}`} className="hk6-modal-row hk6-modal-row--draw">
                    <div className="hk6-modal-row-line1">
                      <span>{row.period}</span>
                      <span className="hk6-modal-row-nums">
                        {row.nums}
                        {row.sum != null ? ` =${row.sum}` : ''}
                      </span>
                      <span className="hk6-modal-row-time">{row.time}</span>
                    </div>
                    {row.derived ? (
                      <div className="hk6-modal-row-derived">{formatDerived(row.derived)}</div>
                    ) : null}
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

export default Canada28GamePage;
