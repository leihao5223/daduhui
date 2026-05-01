import React, { useMemo, useState, useCallback } from 'react';
import { zodiacMeta } from '../../games/hkMarkSix/playCatalog';
import {
  dragSanZhongErTwoBank,
  dragSanZhongErOneBank,
  dragSanQuanZhong,
  dragLinkTwoEach,
  dragSzl2,
  dragSzl3,
  dragSzl4,
  dragWl2,
  dragWl3,
  dragWl4,
  pengZodiacPair,
  pengTailPair,
  pengZodiacTailPair,
  pengZodiacTriple,
  filterNewKeys,
} from '../../games/hkMarkSix/quickBet';

const NUMS = Array.from({ length: 49 }, (_, i) => String(i + 1).padStart(2, '0'));

export type QuickBetLabels = {
  dragBlock: string;
  pengBlock: string;
  numPattern: string;
  sz2Two: string;
  sz2One: string;
  sz3: string;
  eq2: string;
  e2t: string;
  tc: string;
  bucketHint: string;
  bank: string;
  tuo: string;
  clear: string;
  genDrag: string;
  szlWl: string;
  szlHit: string;
  szlMiss: string;
  szlPattern: string;
  szl2: string;
  szl3: string;
  szl4: string;
  wl2: string;
  wl3: string;
  wl4: string;
  bankZ: string;
  tuoZ: string;
  bankTail: string;
  tuoTail: string;
  pengKind: string;
  pengZodiac: string;
  pengTail: string;
  pengZT: string;
  pengSz3: string;
  zLeft: string;
  zRight: string;
  zThird: string;
  lmSubtype: string;
  genPeng: string;
  capWarn: string;
  empty: string;
  added: (n: number) => string;
  tailPickA: string;
  tailPickB: string;
  zThird: string;
  lmSubtype: string;
};

type LinkDragKind = 'sz2-2' | 'sz2-1' | 'sz3' | 'eq2' | 'e2t' | 'tc';

type SzlWlKind =
  | 'szl2'
  | 'szl3'
  | 'szl4'
  | 'wl2'
  | 'wl3'
  | 'wl4';

type PengKind = 'zz' | 'tt' | 'zt' | 'sz3';

type Props = {
  onAddKeys: (keys: string[]) => void;
  existingKeys: Set<string>;
  labels: QuickBetLabels;
};

export const HkMarkSixQuickBetPanel: React.FC<Props> = ({ onAddKeys, existingKeys, labels }) => {
  const [linkKind, setLinkKind] = useState<LinkDragKind>('sz2-2');
  const [bankNums, setBankNums] = useState<string[]>([]);
  const [tuoNums, setTuoNums] = useState<string[]>([]);
  const [numBucket, setNumBucket] = useState<'bank' | 'tuo'>('bank');

  const [szlKind, setSzlKind] = useState<SzlWlKind>('szl2');
  const [szlHit, setSzlHit] = useState(true);
  const [bankZ, setBankZ] = useState<string>('');
  const [tuoZSet, setTuoZSet] = useState<string[]>([]);
  const [bankTail, setBankTail] = useState<number | null>(null);
  const [tuoTails, setTuoTails] = useState<number[]>([]);

  const [pengKind, setPengKind] = useState<PengKind>('zz');
  const [pengLm, setPengLm] = useState<'eq2' | 'e2t' | 'tc'>('eq2');
  const [pzA, setPzA] = useState('');
  const [pzB, setPzB] = useState('');
  const [pzC, setPzC] = useState('');
  const [ptA, setPtA] = useState<number | null>(null);
  const [ptB, setPtB] = useState<number | null>(null);
  const [pztZ, setPztZ] = useState('');
  const [pztTail, setPztTail] = useState<number | null>(null);

  const bankMax = linkKind === 'sz2-2' || linkKind === 'sz3' ? 2 : 1;

  const toggleNum = useCallback(
    (n: string) => {
      if (numBucket === 'bank') {
        setBankNums((prev) => {
          if (prev.includes(n)) return prev.filter((x) => x !== n);
          if (prev.length >= bankMax) return prev;
          return [...prev, n];
        });
      } else {
        setTuoNums((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
      }
    },
    [bankMax, numBucket],
  );

  const genNumDrag = () => {
    let keys: string[] = [];
    if (linkKind === 'sz2-2') keys = dragSanZhongErTwoBank(bankNums, tuoNums);
    else if (linkKind === 'sz2-1') keys = dragSanZhongErOneBank(bankNums[0] || '', tuoNums);
    else if (linkKind === 'sz3') keys = dragSanQuanZhong(bankNums, tuoNums);
    else if (linkKind === 'eq2') keys = dragLinkTwoEach('eq2', bankNums[0] || '', tuoNums);
    else if (linkKind === 'e2t') keys = dragLinkTwoEach('e2t', bankNums[0] || '', tuoNums);
    else keys = dragLinkTwoEach('tc', bankNums[0] || '', tuoNums);

    if (keys.length === 0) {
      window.alert(labels.empty);
      return;
    }
    if (keys.length >= MAX_QUICK_KEYS) window.alert(labels.capWarn);
    const fresh = filterNewKeys(keys, existingKeys);
    if (fresh.length === 0) {
      window.alert(labels.empty);
      return;
    }
    onAddKeys(fresh);
    window.alert(labels.added(fresh.length));
    setTuoNums([]);
  };

  const toggleTuoZ = (z: string) => {
    setTuoZSet((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));
  };

  const toggleTuoTail = (t: number) => {
    setTuoTails((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const genZodiTailDrag = () => {
    if (!bankZ) {
      window.alert(labels.empty);
      return;
    }
    let keys: string[] = [];
    if (szlKind === 'szl2') keys = dragSzl2(szlHit, bankZ, tuoZSet);
    else if (szlKind === 'szl3') keys = dragSzl3(szlHit, bankZ, tuoZSet);
    else if (szlKind === 'szl4') keys = dragSzl4(szlHit, bankZ, tuoZSet);
    else if (szlKind === 'wl2') {
      if (bankTail == null) {
        window.alert(labels.empty);
        return;
      }
      keys = dragWl2(szlHit, bankTail, tuoTails);
    } else if (szlKind === 'wl3') {
      if (bankTail == null) {
        window.alert(labels.empty);
        return;
      }
      keys = dragWl3(szlHit, bankTail, tuoTails);
    } else {
      if (bankTail == null) {
        window.alert(labels.empty);
        return;
      }
      keys = dragWl4(szlHit, bankTail, tuoTails);
    }

    if (keys.length === 0) {
      window.alert(labels.empty);
      return;
    }
    if (keys.length >= MAX_QUICK_KEYS) window.alert(labels.capWarn);
    const fresh = filterNewKeys(keys, existingKeys);
    if (fresh.length === 0) {
      window.alert(labels.empty);
      return;
    }
    onAddKeys(fresh);
    window.alert(labels.added(fresh.length));
    setTuoZSet([]);
    setTuoTails([]);
  };

  const genPeng = () => {
    let keys: string[] = [];
    if (pengKind === 'zz') {
      if (!pzA || !pzB || pzA === pzB) {
        window.alert(labels.empty);
        return;
      }
      keys = pengZodiacPair(pengLm, pzA, pzB);
    } else if (pengKind === 'tt') {
      if (ptA == null || ptB == null || ptA === ptB) {
        window.alert(labels.empty);
        return;
      }
      keys = pengTailPair(pengLm, ptA, ptB);
    } else if (pengKind === 'zt') {
      if (!pztZ || pztTail == null) {
        window.alert(labels.empty);
        return;
      }
      keys = pengZodiacTailPair(pengLm, pztZ, pztTail);
    } else {
      if (!pzA || !pzB || !pzC || new Set([pzA, pzB, pzC]).size !== 3) {
        window.alert(labels.empty);
        return;
      }
      keys = pengZodiacTriple(pzA, pzB, pzC);
    }
    if (keys.length === 0) {
      window.alert(labels.empty);
      return;
    }
    if (keys.length >= MAX_QUICK_KEYS) window.alert(labels.capWarn);
    const fresh = filterNewKeys(keys, existingKeys);
    if (fresh.length === 0) {
      window.alert(labels.empty);
      return;
    }
    onAddKeys(fresh);
    window.alert(labels.added(fresh.length));
  };

  const isWl = szlKind.startsWith('wl');

  const pengPreview = useMemo(() => {
    if (pengKind === 'zz' && pzA && pzB && pzA !== pzB) {
      const la = zodiacMeta.find((z) => z.id === pzA)?.label ?? '';
      const lb = zodiacMeta.find((z) => z.id === pzB)?.label ?? '';
      return `${la}×${lb}`;
    }
    if (pengKind === 'tt' && ptA != null && ptB != null) return `${ptA}尾×${ptB}尾`;
    if (pengKind === 'zt' && pztZ && pztTail != null) {
      const lz = zodiacMeta.find((z) => z.id === pztZ)?.label ?? '';
      return `${lz}+${pztTail}尾`;
    }
    if (pengKind === 'sz3' && pzA && pzB && pzC) return '三肖三全中';
    return '—';
  }, [pengKind, pzA, pzB, pzC, ptA, ptB, pztZ, pztTail]);

  return (
    <div className="hk6-quick">
      <section className="hk6-quick-section">
        <h3 className="hk6-quick-h">{labels.dragBlock}</h3>
        <p className="hk6-quick-sub">{labels.numPattern}</p>
        <select
          className="hk6-combo-select hk6-quick-select"
          value={linkKind}
          onChange={(e) => {
            setLinkKind(e.target.value as LinkDragKind);
            setBankNums([]);
            setTuoNums([]);
          }}
        >
          <option value="sz2-2">{labels.sz2Two}</option>
          <option value="sz2-1">{labels.sz2One}</option>
          <option value="sz3">{labels.sz3}</option>
          <option value="eq2">{labels.eq2}</option>
          <option value="e2t">{labels.e2t}</option>
          <option value="tc">{labels.tc}</option>
        </select>
        <p className="hk6-quick-bucket-hint">{labels.bucketHint}</p>
        <div className="hk6-quick-bucket-tabs">
          <button
            type="button"
            className={numBucket === 'bank' ? 'hk6-quick-btab hk6-quick-btab--on' : 'hk6-quick-btab'}
            onClick={() => setNumBucket('bank')}
          >
            {labels.bank}（{bankNums.length}/{bankMax}）
          </button>
          <button
            type="button"
            className={numBucket === 'tuo' ? 'hk6-quick-btab hk6-quick-btab--on' : 'hk6-quick-btab'}
            onClick={() => setNumBucket('tuo')}
          >
            {labels.tuo}（{tuoNums.length}）
          </button>
        </div>
        <div className="hk6-quick-mini">
          <span>
            {labels.bank}: {bankNums.length ? bankNums.sort().join(', ') : '—'}
          </span>
          <button type="button" className="hk6-quick-x" onClick={() => setBankNums([])}>
            {labels.clear}
          </button>
        </div>
        <div className="hk6-quick-mini">
          <span>
            {labels.tuo}: {tuoNums.length ? tuoNums.sort().join(', ') : '—'}
          </span>
          <button type="button" className="hk6-quick-x" onClick={() => setTuoNums([])}>
            {labels.clear}
          </button>
        </div>
        <div className="hk6-combo-grid hk6-combo-grid--nums hk6-quick-grid">
          {NUMS.map((n) => {
            const inB = bankNums.includes(n);
            const inT = tuoNums.includes(n);
            const on = inB || inT;
            return (
              <button
                key={n}
                type="button"
                className={`hk6-combo-cell ${on ? 'hk6-combo-cell--on' : ''} ${inB ? 'hk6-num--bank' : ''} ${
                  inT ? 'hk6-num--tuo' : ''
                }`}
                onClick={() => toggleNum(n)}
              >
                {n}
              </button>
            );
          })}
        </div>
        <button type="button" className="hk6-combo-add hk6-quick-gen" onClick={genNumDrag}>
          {labels.genDrag}
        </button>
      </section>

      <section className="hk6-quick-section">
        <h3 className="hk6-quick-h">{labels.szlWl}</h3>
        <div className="hk6-quick-row">
          <label className="hk6-quick-inline">
            <input type="checkbox" checked={szlHit} onChange={(e) => setSzlHit(e.target.checked)} />
            {szlHit ? labels.szlHit : labels.szlMiss}
          </label>
        </div>
        <select
          className="hk6-combo-select hk6-quick-select"
          value={szlKind}
          onChange={(e) => setSzlKind(e.target.value as SzlWlKind)}
        >
          <option value="szl2">{labels.szl2}</option>
          <option value="szl3">{labels.szl3}</option>
          <option value="szl4">{labels.szl4}</option>
          <option value="wl2">{labels.wl2}</option>
          <option value="wl3">{labels.wl3}</option>
          <option value="wl4">{labels.wl4}</option>
        </select>
        <p className="hk6-quick-sub">{labels.szlPattern}</p>

        {!isWl ? (
          <>
            <p className="hk6-quick-k">{labels.bankZ}</p>
            <div className="hk6-combo-zodiac">
              {zodiacMeta.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={`hk6-combo-zbtn ${bankZ === z.id ? 'hk6-combo-zbtn--on' : ''}`}
                  onClick={() => setBankZ(bankZ === z.id ? '' : z.id)}
                >
                  {z.label}
                </button>
              ))}
            </div>
            <p className="hk6-quick-k">{labels.tuoZ}</p>
            <div className="hk6-combo-zodiac">
              {zodiacMeta.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={`hk6-combo-zbtn ${tuoZSet.includes(z.id) ? 'hk6-combo-zbtn--on' : ''}`}
                  onClick={() => toggleTuoZ(z.id)}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="hk6-quick-k">{labels.bankTail}</p>
            <div className="hk6-combo-tails">
              {Array.from({ length: 10 }, (_, d) => (
                <button
                  key={d}
                  type="button"
                  className={`hk6-combo-tbtn ${bankTail === d ? 'hk6-combo-tbtn--on' : ''}`}
                  onClick={() => setBankTail(bankTail === d ? null : d)}
                >
                  {d}尾
                </button>
              ))}
            </div>
            <p className="hk6-quick-k">{labels.tuoTail}</p>
            <div className="hk6-combo-tails">
              {Array.from({ length: 10 }, (_, d) => (
                <button
                  key={d}
                  type="button"
                  className={`hk6-combo-tbtn ${tuoTails.includes(d) ? 'hk6-combo-tbtn--on' : ''}`}
                  onClick={() => toggleTuoTail(d)}
                >
                  {d}尾
                </button>
              ))}
            </div>
          </>
        )}
        <button type="button" className="hk6-combo-add hk6-quick-gen" onClick={genZodiTailDrag}>
          {labels.genDrag}
        </button>
      </section>

      <section className="hk6-quick-section">
        <h3 className="hk6-quick-h">{labels.pengBlock}</h3>
        <p className="hk6-quick-preview">
          {labels.pengKind}: {pengPreview}
        </p>
        <select
          className="hk6-combo-select hk6-quick-select"
          value={pengKind}
          onChange={(e) => setPengKind(e.target.value as PengKind)}
        >
          <option value="zz">{labels.pengZodiac}</option>
          <option value="tt">{labels.pengTail}</option>
          <option value="zt">{labels.pengZT}</option>
          <option value="sz3">{labels.pengSz3}</option>
        </select>

        {pengKind !== 'sz3' ? (
          <select
            className="hk6-combo-select hk6-quick-select"
            value={pengLm}
            onChange={(e) => setPengLm(e.target.value as 'eq2' | 'e2t' | 'tc')}
          >
            <option value="eq2">{labels.lmSubtype} · 二全中</option>
            <option value="e2t">{labels.lmSubtype} · 二中特</option>
            <option value="tc">{labels.lmSubtype} · 特串</option>
          </select>
        ) : null}

        {pengKind === 'zz' ? (
          <div className="hk6-quick-peng-row">
            <div>
              <span className="hk6-quick-k">{labels.zLeft}</span>
              <select className="hk6-combo-select" value={pzA} onChange={(e) => setPzA(e.target.value)}>
                <option value="">—</option>
                {zodiacMeta.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="hk6-quick-k">{labels.zRight}</span>
              <select className="hk6-combo-select" value={pzB} onChange={(e) => setPzB(e.target.value)}>
                <option value="">—</option>
                {zodiacMeta.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {pengKind === 'tt' ? (
          <div className="hk6-quick-peng-row">
            <div>
              <span className="hk6-quick-k">{labels.tailPickA}</span>
              <select
                className="hk6-combo-select"
                value={ptA == null ? '' : String(ptA)}
                onChange={(e) => setPtA(e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, d) => (
                  <option key={d} value={d}>
                    {d}尾
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="hk6-quick-k">{labels.tailPickB}</span>
              <select
                className="hk6-combo-select"
                value={ptB == null ? '' : String(ptB)}
                onChange={(e) => setPtB(e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, d) => (
                  <option key={d} value={d}>
                    {d}尾
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {pengKind === 'zt' ? (
          <div className="hk6-quick-peng-row">
            <div>
              <span className="hk6-quick-k">{labels.zLeft}</span>
              <select className="hk6-combo-select" value={pztZ} onChange={(e) => setPztZ(e.target.value)}>
                <option value="">—</option>
                {zodiacMeta.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="hk6-quick-k">{labels.tailPickB}</span>
              <select
                className="hk6-combo-select"
                value={pztTail == null ? '' : String(pztTail)}
                onChange={(e) => setPztTail(e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, d) => (
                  <option key={d} value={d}>
                    {d}尾
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {pengKind === 'sz3' ? (
          <div className="hk6-quick-peng-col">
            <span className="hk6-quick-k">{labels.zLeft}</span>
            <select className="hk6-combo-select" value={pzA} onChange={(e) => setPzA(e.target.value)}>
              <option value="">—</option>
              {zodiacMeta.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
            <span className="hk6-quick-k">{labels.zRight}</span>
            <select className="hk6-combo-select" value={pzB} onChange={(e) => setPzB(e.target.value)}>
              <option value="">—</option>
              {zodiacMeta.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
            <span className="hk6-quick-k">{labels.zThird}</span>
            <select className="hk6-combo-select" value={pzC} onChange={(e) => setPzC(e.target.value)}>
              <option value="">—</option>
              {zodiacMeta.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button type="button" className="hk6-combo-add hk6-quick-gen" onClick={genPeng}>
          {labels.genPeng}
        </button>
      </section>
    </div>
  );
};
