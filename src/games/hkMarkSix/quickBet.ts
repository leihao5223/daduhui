/**
 * 胆拖 / 对碰：生成多条 HK6 注项 key（与 server hkMarkSixRules 一致）
 */

export const MAX_QUICK_KEYS = 480;

export const ZODIAC_NUMS: Record<string, string[]> = {
  rat: ['07', '19', '31', '43'],
  ox: ['06', '18', '30', '42'],
  tiger: ['05', '17', '29', '41'],
  rabbit: ['04', '16', '28', '40'],
  dragon: ['03', '15', '27', '39'],
  snake: ['02', '14', '26', '38'],
  horse: ['01', '13', '25', '37', '49'],
  goat: ['12', '24', '36', '48'],
  monkey: ['11', '23', '35', '47'],
  rooster: ['10', '22', '34', '46'],
  dog: ['09', '21', '33', '45'],
  pig: ['08', '20', '32', '44'],
};

export const TAIL_NUMS: Record<number, string[]> = {
  0: ['10', '20', '30', '40'],
  1: ['01', '11', '21', '31', '41'],
  2: ['02', '12', '22', '32', '42'],
  3: ['03', '13', '23', '33', '43'],
  4: ['04', '14', '24', '34', '44'],
  5: ['05', '15', '25', '35', '45'],
  6: ['06', '16', '26', '36', '46'],
  7: ['07', '17', '27', '37', '47'],
  8: ['08', '18', '28', '38', '48'],
  9: ['09', '19', '29', '39', '49'],
};

export function pad2(x: string | number): string {
  const n = Math.trunc(Number(x));
  if (n < 1 || n > 49) return '';
  return String(n).padStart(2, '0');
}

function sortNums(nums: string[]): string {
  return [...new Set(nums.map((x) => pad2(x)).filter(Boolean))].sort().join(',');
}

function pushCap(out: string[], key: string): boolean {
  if (out.length >= MAX_QUICK_KEYS) return false;
  out.push(key);
  return true;
}

/** 三中二：2 胆 + 每托（规则书例题） */
export function dragSanZhongErTwoBank(bankers: string[], drag: string[]): string[] {
  if (bankers.length !== 2 || drag.length === 0) return [];
  const [b1, b2] = [pad2(bankers[0]), pad2(bankers[1])].filter(Boolean).sort();
  if (!b1 || !b2 || b1 === b2) return [];
  const out: string[] = [];
  for (const d of drag) {
    const t = pad2(d);
    if (!t || t === b1 || t === b2) continue;
    if (!pushCap(out, `lm:sz2:${sortNums([b1, b2, t])}`)) break;
  }
  return out;
}

/** 三中二：1 胆 + 托中任选 2 个组三元组 */
export function dragSanZhongErOneBank(banker: string, drag: string[]): string[] {
  const b = pad2(banker);
  if (!b || drag.length < 2) return [];
  const ds = [...new Set(drag.map(pad2).filter((x) => x && x !== b))].sort();
  if (ds.length < 2) return [];
  const out: string[] = [];
  for (let i = 0; i < ds.length; i += 1) {
    for (let j = i + 1; j < ds.length; j += 1) {
      if (!pushCap(out, `lm:sz2:${sortNums([b, ds[i]!, ds[j]!])}`)) return out;
    }
  }
  return out;
}

/** 三全中：2 胆 + 每托 */
export function dragSanQuanZhong(bankers: string[], drag: string[]): string[] {
  return dragSanZhongErTwoBank(bankers, drag).map((k) => k.replace('lm:sz2:', 'lm:sz3:'));
}

/** 二全中 / 二中特 / 特串：1 胆 + 每托一条二码 */
export function dragLinkTwoEach(
  lm: 'eq2' | 'e2t' | 'tc',
  banker: string,
  drag: string[],
): string[] {
  const b = pad2(banker);
  if (!b || drag.length === 0) return [];
  const out: string[] = [];
  for (const d of drag) {
    const t = pad2(d);
    if (!t || t === b) continue;
    if (!pushCap(out, `lm:${lm}:${sortNums([b, t])}`)) break;
  }
  return out;
}

/** 二肖连（中/不中）：鼠拖牛、虎 → 鼠-牛、鼠-虎 */
export function dragSzl2(hit: boolean, bankerZ: string, dragZ: string[]): string[] {
  const b = bankerZ.trim();
  if (!b || dragZ.length === 0) return [];
  const h = hit ? 'h' : 'nh';
  const out: string[] = [];
  for (const z of [...new Set(dragZ)]) {
    if (z === b) continue;
    const key = `szl:2:${h}:${[b, z].sort().join(',')}`;
    if (!pushCap(out, key)) break;
  }
  return out;
}

/** 三肖连：1 胆肖 + 托肖任选 2 个 */
export function dragSzl3(hit: boolean, bankerZ: string, dragZ: string[]): string[] {
  const b = bankerZ.trim();
  if (!b || dragZ.length < 2) return [];
  const ds = [...new Set(dragZ)].filter((z) => z !== b).sort();
  if (ds.length < 2) return [];
  const h = hit ? 'h' : 'nh';
  const out: string[] = [];
  for (let i = 0; i < ds.length; i += 1) {
    for (let j = i + 1; j < ds.length; j += 1) {
      const key = `szl:3:${h}:${[b, ds[i]!, ds[j]!].sort().join(',')}`;
      if (!pushCap(out, key)) return out;
    }
  }
  return out;
}

/** 四肖连：1 胆 + 托肖任选 3 */
export function dragSzl4(hit: boolean, bankerZ: string, dragZ: string[]): string[] {
  const b = bankerZ.trim();
  if (!b || dragZ.length < 3) return [];
  const ds = [...new Set(dragZ)].filter((z) => z !== b).sort();
  if (ds.length < 3) return [];
  const h = hit ? 'h' : 'nh';
  const out: string[] = [];
  for (let i = 0; i < ds.length; i += 1) {
    for (let j = i + 1; j < ds.length; j += 1) {
      for (let k = j + 1; k < ds.length; k += 1) {
        const key = `szl:4:${h}:${[b, ds[i]!, ds[j]!, ds[k]!].sort().join(',')}`;
        if (!pushCap(out, key)) return out;
      }
    }
  }
  return out;
}

/** 二尾连：1 胆尾 + 每托尾 */
export function dragWl2(hit: boolean, bankerTail: number, dragTails: number[]): string[] {
  const h = hit ? 'h' : 'nh';
  const out: string[] = [];
  for (const t of [...new Set(dragTails)]) {
    if (t === bankerTail) continue;
    if (t < 0 || t > 9) continue;
    const pair = [bankerTail, t].sort((a, b) => a - b).join(',');
    if (!pushCap(out, `wl:2:${h}:${pair}`)) break;
  }
  return out;
}

/** 三尾连：1 胆尾 + 托尾任选 2 */
export function dragWl3(hit: boolean, bankerTail: number, dragTails: number[]): string[] {
  const tails = [...new Set(dragTails)].filter((t) => t !== bankerTail && t >= 0 && t <= 9).sort((a, b) => a - b);
  if (tails.length < 2) return [];
  const h = hit ? 'h' : 'nh';
  const out: string[] = [];
  for (let i = 0; i < tails.length; i += 1) {
    for (let j = i + 1; j < tails.length; j += 1) {
      const trip = [bankerTail, tails[i]!, tails[j]!].sort((a, b) => a - b).join(',');
      if (!pushCap(out, `wl:3:${h}:${trip}`)) return out;
    }
  }
  return out;
}

/** 四尾连：1 胆尾 + 托尾任选 3 */
export function dragWl4(hit: boolean, bankerTail: number, dragTails: number[]): string[] {
  const tails = [...new Set(dragTails)].filter((t) => t !== bankerTail && t >= 0 && t <= 9).sort((a, b) => a - b);
  if (tails.length < 3) return [];
  const h = hit ? 'h' : 'nh';
  const out: string[] = [];
  for (let i = 0; i < tails.length; i += 1) {
    for (let j = i + 1; j < tails.length; j += 1) {
      for (let k = j + 1; k < tails.length; k += 1) {
        const q = [bankerTail, tails[i]!, tails[j]!, tails[k]!].sort((a, b) => a - b).join(',');
        if (!pushCap(out, `wl:4:${h}:${q}`)) return out;
      }
    }
  }
  return out;
}

export type LinkPairMode = 'eq2' | 'e2t' | 'tc';

function numsForZodiac(z: string): string[] {
  return ZODIAC_NUMS[z] ? [...ZODIAC_NUMS[z]] : [];
}

/** 生肖对碰 → 两生肖号码两两组合（去重、上限） */
export function pengZodiacPair(lm: LinkPairMode, zA: string, zB: string): string[] {
  const a = numsForZodiac(zA);
  const b = numsForZodiac(zB);
  if (!a.length || !b.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const na of a) {
    for (const nb of b) {
      if (na === nb) continue;
      const key = `lm:${lm}:${sortNums([na, nb])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
      if (out.length >= MAX_QUICK_KEYS) return out;
    }
  }
  return out;
}

/** 尾数对碰 */
export function pengTailPair(lm: LinkPairMode, tailA: number, tailB: number): string[] {
  const a = TAIL_NUMS[tailA] || [];
  const b = TAIL_NUMS[tailB] || [];
  if (!a.length || !b.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const na of a) {
    for (const nb of b) {
      if (na === nb) continue;
      const key = `lm:${lm}:${sortNums([na, nb])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
      if (out.length >= MAX_QUICK_KEYS) return out;
    }
  }
  return out;
}

/** 生肖+尾数过滤后的号码集，再两两对碰 */
export function pengZodiacTailPair(lm: LinkPairMode, zodiac: string, tail: number): string[] {
  const nums = numsForZodiac(zodiac).filter((n) => Number(n[1]) === tail);
  if (nums.length < 2) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < nums.length; i += 1) {
    for (let j = i + 1; j < nums.length; j += 1) {
      const key = `lm:${lm}:${sortNums([nums[i]!, nums[j]!])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
      if (out.length >= MAX_QUICK_KEYS) return out;
    }
  }
  return out;
}

/** 三全中：三生肖号码各取一号 → 三元组（有上限） */
export function pengZodiacTriple(zA: string, zB: string, zC: string): string[] {
  const a = numsForZodiac(zA);
  const b = numsForZodiac(zB);
  const c = numsForZodiac(zC);
  if (!a.length || !b.length || !c.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const na of a) {
    for (const nb of b) {
      for (const nc of c) {
        if (na === nb || na === nc || nb === nc) continue;
        const key = `lm:sz3:${sortNums([na, nb, nc])}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(key);
        if (out.length >= MAX_QUICK_KEYS) return out;
      }
    }
  }
  return out;
}

export function filterNewKeys(keys: string[], existing: Set<string>): string[] {
  return keys.filter((k) => !existing.has(k));
}
