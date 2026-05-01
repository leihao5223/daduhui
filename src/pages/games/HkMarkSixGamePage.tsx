import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hkMarkSixPlayCatalog, lineKey } from '../../games/hkMarkSix/playCatalog';
import { apiGet, apiPost } from '../../api/http';
import { getToken } from '../../lib/auth';
import '../../styles/hk-marksix-game.css';
import { gamesContent } from '../../content/games';
import { HkMarkSixComboPanel } from './HkMarkSixComboPanel';
import { HkMarkSixQuickBetPanel, type QuickBetLabels } from './HkMarkSixQuickBetPanel';

type Hk6DrawDerived = {
  main: Array<{ zodiac?: string | null }>;
  special: {
    zodiac?: string | null;
    sizeZh?: string;
    parityZh?: string;
    comboZh?: string | null;
    halfWaveZh?: string | null;
  };
  totalSumSeven: number;
  totalSizeSevenZh: string;
  zodiacsInDraw?: { id: string; name: string }[];
};

function formatHk6DerivedSummary(d: Hk6DrawDerived): string {
  const sp = d.special;
  const parts: string[] = [];
  if (sp?.zodiac) parts.push(`特肖${sp.zodiac}`);
  if (sp?.halfWaveZh) parts.push(`半波${sp.halfWaveZh}`);
  else if (sp?.sizeZh && sp?.parityZh) parts.push(`特码${sp.sizeZh}${sp.parityZh}`);
  if (sp?.comboZh) parts.push(sp.comboZh);
  parts.push(`七码和${d.totalSumSeven}（总${d.totalSizeSevenZh}）`);
  if (d.zodiacsInDraw?.length) {
    parts.push(`七肖：${d.zodiacsInDraw.map((z) => z.name).join('')}`);
  }
  return parts.join(' · ');
}

type Hk6Status = {
  success?: boolean;
  drawsCount?: number;
  currentPeriod?: string;
  countdownSec?: number;
  sync?: {
    url?: string;
    enabled?: boolean;
    source?: string | null;
    at?: string | null;
    err?: string | null;
  };
  lastDraw?: {
    period?: string;
    balls?: string[];
    special?: string;
    drawnAt?: string;
    derived?: Hk6DrawDerived;
  };
};

type Hk6HistoryRow = {
  period: string;
  balls: string;
  time: string;
  derived?: Hk6DrawDerived;
};

const HK_RED = new Set([
  '01',
  '02',
  '07',
  '08',
  '12',
  '13',
  '18',
  '19',
  '23',
  '24',
  '29',
  '30',
  '34',
  '35',
  '40',
  '45',
  '46',
]);
const HK_BLUE = new Set([
  '03',
  '04',
  '09',
  '10',
  '14',
  '15',
  '20',
  '25',
  '26',
  '31',
  '36',
  '37',
  '41',
  '42',
  '47',
  '48',
]);
const HK_GREEN = new Set([
  '05',
  '06',
  '11',
  '16',
  '17',
  '21',
  '22',
  '27',
  '28',
  '32',
  '33',
  '38',
  '39',
  '43',
  '44',
  '49',
]);

function ballTone(num: string): 'r' | 'b' | 'g' {
  const n = String(num).padStart(2, '0');
  if (HK_RED.has(n)) return 'r';
  if (HK_BLUE.has(n)) return 'b';
  if (HK_GREEN.has(n)) return 'g';
  return 'r';
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
  const [statusReqFailed, setStatusReqFailed] = useState(false);
  const [historyRows, setHistoryRows] = useState<Hk6HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betting, setBetting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [hkTurnover, setHkTurnover] = useState<number | null>(null);
  const [hkPnl, setHkPnl] = useState<number | null>(null);
  const [hkRebate, setHkRebate] = useState<number | null>(null);

  const activeCategory = useMemo(
    () => hkMarkSixPlayCatalog.find((c) => c.id === activeCategoryId),
    [activeCategoryId],
  );

  const refreshBalance = useCallback(async () => {
    if (!getToken()) {
      setBalance(null);
      setHkTurnover(null);
      setHkPnl(null);
      setHkRebate(null);
      return;
    }
    try {
      const r = await apiGet<{
        success?: boolean;
        data?: {
          available?: number;
          hk6Turnover?: number;
          hk6Pnl?: number | null;
          hk6Rebate?: number | null;
        };
      }>('/api/me/summary');
      if (r.success && r.data) {
        if (typeof r.data.available === 'number') setBalance(r.data.available);
        if (typeof r.data.hk6Turnover === 'number') setHkTurnover(r.data.hk6Turnover);
        setHkPnl(typeof r.data.hk6Pnl === 'number' ? r.data.hk6Pnl : null);
        setHkRebate(typeof r.data.hk6Rebate === 'number' ? r.data.hk6Rebate : null);
      }
    } catch {
      setBalance(null);
      setHkTurnover(null);
      setHkPnl(null);
      setHkRebate(null);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const s = await apiGet<Hk6Status>('/api/game/hk-marksix/status', { timeout: 45000 });
        if (!cancelled) {
          // #region agent log
          fetch('http://127.0.0.1:7583/ingest/3df9935a-40e5-45e4-9007-bbd3b69c0c3b', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6a3aec' },
            body: JSON.stringify({
              sessionId: '6a3aec',
              runId: 'pre-fix',
              hypothesisId: 'C',
              location: 'HkMarkSixGamePage.tsx:tick',
              message: 'client status snapshot',
              data: {
                hasLastDraw: !!s?.lastDraw,
                ballsIsArray: Array.isArray(s?.lastDraw?.balls),
                ballsLen: s?.lastDraw?.balls?.length,
                drawsCount: s?.drawsCount,
                statusReqOk: true,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          setStatus(s);
          setStatusReqFailed(false);
        }
      } catch {
        if (!cancelled) {
          // #region agent log
          fetch('http://127.0.0.1:7583/ingest/3df9935a-40e5-45e4-9007-bbd3b69c0c3b', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6a3aec' },
            body: JSON.stringify({
              sessionId: '6a3aec',
              runId: 'pre-fix',
              hypothesisId: 'C',
              location: 'HkMarkSixGamePage.tsx:tick',
              message: 'client status fetch failed',
              data: { statusReqOk: false },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          setStatus(null);
          setStatusReqFailed(true);
        }
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
          '/api/game/hk-marksix/history?limit=200',
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

  const [comboSubTab, setComboSubTab] = useState<'manual' | 'quick'>('manual');

  const quickBetLabels = useMemo<QuickBetLabels>(
    () => ({
      dragBlock: hk.quickDragNums,
      pengBlock: hk.quickPeng,
      numPattern: hk.quickNumPat,
      sz2Two: hk.quickSz2Two,
      sz2One: hk.quickSz2One,
      sz3: hk.quickSz3,
      eq2: hk.quickEq2,
      e2t: hk.quickE2t,
      tc: hk.quickTc,
      bucketHint: hk.quickBucket,
      bank: hk.quickBank,
      tuo: hk.quickTuo,
      clear: hk.quickClear,
      genDrag: hk.quickGen,
      szlWl: hk.quickDragZT,
      szlHit: hk.quickSzlHit,
      szlMiss: hk.quickSzlMiss,
      szlPattern: hk.quickSzlPat,
      szl2: hk.quickSzl2,
      szl3: hk.quickSzl3,
      szl4: hk.quickSzl4,
      wl2: hk.quickWl2,
      wl3: hk.quickWl3,
      wl4: hk.quickWl4,
      bankZ: hk.quickBankZ,
      tuoZ: hk.quickTuoZ,
      bankTail: hk.quickBankTail,
      tuoTail: hk.quickTuoTail,
      pengKind: hk.quickPengKind,
      pengZodiac: hk.quickPengZ,
      pengTail: hk.quickPengT,
      pengZT: hk.quickPengZT,
      pengSz3: hk.quickPengSz3,
      zLeft: hk.quickZLeft,
      zRight: hk.quickZRight,
      zThird: hk.quickZThird,
      lmSubtype: hk.quickLmSub,
      genPeng: hk.quickGenPeng,
      capWarn: hk.quickCap,
      empty: hk.quickEmpty,
      added: hk.quickAdded,
      tailPickA: hk.quickTailA,
      tailPickB: hk.quickTailB,
    }),
    [hk],
  );

  const addComboLine = useCallback((key: string) => {
    setSelectedKeys((prev) => new Set(prev).add(key));
  }, []);

  const addComboLines = useCallback((keys: string[]) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.add(k);
      return next;
    });
  }, []);

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
    const der = ld.derived;
    const main = ld.balls.map((n, idx) => ({
      n,
      tone: ballTone(n),
      zodiac: der?.main?.[idx]?.zodiac ?? null,
    }));
    const sp = ld.special
      ? [{ n: ld.special, tone: ballTone(ld.special), zodiac: der?.special?.zodiac ?? null }]
      : [];
    return [...main, ...sp];
  }, [status?.lastDraw]);

  const lastDrawDerivedSummary = useMemo(
    () => (status?.lastDraw?.derived ? formatHk6DerivedSummary(status.lastDraw.derived) : null),
    [status?.lastDraw?.derived],
  );

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

  useEffect(() => {
    if (activeCategoryId !== 'combo') setComboSubTab('manual');
  }, [activeCategoryId]);

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
                : statusReqFailed
                  ? hk.statusApiError
                  : status?.sync?.enabled && status.sync?.err
                    ? hk.syncFailed(status.sync.err)
                    : status?.drawsCount === 0 && status?.sync?.enabled && !status?.sync?.err
                      ? hk.syncStuckHint
                      : hk.subtitleLoading}
              {status?.sync?.enabled && status.sync.source ? (
                <span className="hk6-sync-hint">
                  {' '}
                  · {hk.syncSource}: {status.sync.source}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="hk6-stats">
          <span>
            {hk.statsBalance}{' '}
            <b>{balance != null ? balance.toFixed(2) : hk.statsDash}</b>
          </span>
          <span>
            {hk.statsFlow}{' '}
            <b>{hkTurnover != null ? hkTurnover.toFixed(2) : hk.statsDash}</b>
          </span>
          <span>
            {hk.statsPnl}{' '}
            <b>{hkPnl != null ? hkPnl.toFixed(2) : hk.statsDash}</b>
          </span>
          <span>
            {hk.statsRebate}{' '}
            <b>{hkRebate != null ? hkRebate.toFixed(2) : hk.statsDash}</b>
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
              lastDrawBalls.map(({ n, tone, zodiac }, i) => (
                <div key={`${i}-${n}`} className="hk6-ball-wrap">
                  <span className={`hk6-ball hk6-ball--${tone}`}>{n}</span>
                  {zodiac ? <span className="hk6-ball-zodiac">{zodiac}</span> : null}
                </div>
              ))
            ) : (
              <span style={{ opacity: 0.5 }}>{hk.noDraw}</span>
            )}
          </div>
          {lastDrawDerivedSummary ? (
            <div className="hk6-draw-derived" title={lastDrawDerivedSummary}>
              {lastDrawDerivedSummary}
            </div>
          ) : null}
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
          {activeCategoryId === 'combo' ? (
            <>
              <div className="hk6-combo-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  className={`hk6-combo-tab ${comboSubTab === 'manual' ? 'hk6-combo-tab--on' : ''}`}
                  onClick={() => setComboSubTab('manual')}
                >
                  {hk.quickTabManual}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`hk6-combo-tab ${comboSubTab === 'quick' ? 'hk6-combo-tab--on' : ''}`}
                  onClick={() => setComboSubTab('quick')}
                >
                  {hk.quickTabQuick}
                </button>
              </div>
              {comboSubTab === 'manual' ? (
                <HkMarkSixComboPanel
                  onAddKey={addComboLine}
                  existingKeys={selectedKeys}
                  labels={{
                    mode: hk.comboMode,
                    add: hk.comboAdd,
                    clear: hk.comboClear,
                    pickMore: (n) => `${hk.comboPickPrefix} ${n} ${hk.comboPickUnit}`,
                  }}
                />
              ) : (
                <HkMarkSixQuickBetPanel
                  onAddKeys={addComboLines}
                  existingKeys={selectedKeys}
                  labels={quickBetLabels}
                />
              )}
            </>
          ) : (
            activeCategory?.playTypes.map((pt) => (
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
            ))
          )}
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
                  <div key={`${row.period}-${row.time}`} className="hk6-modal-row hk6-modal-row--draw">
                    <div className="hk6-modal-row-line1">
                      <span>{row.period}</span>
                      <span className="hk6-modal-row-nums">{row.balls}</span>
                      <span className="hk6-modal-row-time">{row.time}</span>
                    </div>
                    {row.derived ? (
                      <div className="hk6-modal-row-derived">{formatHk6DerivedSummary(row.derived)}</div>
                    ) : null}
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
