/**
 * 香港六合彩规则与结算
 */

const ZODIAC_IDS = [
  'rat',
  'ox',
  'tiger',
  'rabbit',
  'dragon',
  'snake',
  'horse',
  'goat',
  'monkey',
  'rooster',
  'dog',
  'pig',
];

/** 生肖 -> 号码（两位字符串） */
const ZODIAC_NUMS = {
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

const POULTRY = new Set(['ox', 'horse', 'goat', 'rooster', 'dog', 'pig']);
const BEAST = new Set(['rat', 'tiger', 'rabbit', 'dragon', 'snake', 'monkey']);

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

const TAIL_NUMS = {
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

function pad2(n) {
  return String(Math.trunc(Number(n)) || 0).padStart(2, '0');
}

function waveOfCell(x) {
  const s = pad2(x);
  if (HK_RED.has(s)) return 'r';
  if (HK_BLUE.has(s)) return 'b';
  if (HK_GREEN.has(s)) return 'g';
  return 'g';
}

function numToZodiacId(two) {
  const s = pad2(two);
  for (const id of ZODIAC_IDS) {
    if (ZODIAC_NUMS[id].includes(s)) return id;
  }
  return null;
}

function zodiacSetFromDraw(balls, special) {
  const set = new Set();
  for (const x of [...balls, special]) {
    const z = numToZodiacId(x);
    if (z) set.add(z);
  }
  return set;
}

function tailDigit(two) {
  return Number(pad2(two)[1]);
}

function tailSetFromDraw(balls, special) {
  const set = new Set();
  for (const x of [...balls, special]) set.add(tailDigit(x));
  return set;
}

/** 特码/正码：大小单双（49 和） */
function sizeOfSpecial(sp) {
  const n = Number(pad2(sp));
  if (n === 49) return 'he';
  if (n >= 25) return 'big';
  return 'small';
}

function parityOfSpecial(sp) {
  const n = Number(pad2(sp));
  if (n === 49) return 'he';
  return n % 2 === 1 ? 'odd' : 'even';
}

function decadeHead(sp) {
  const n = Number(pad2(sp));
  if (n <= 9) return 0;
  if (n <= 19) return 1;
  if (n <= 29) return 2;
  if (n <= 39) return 3;
  return 4;
}

function sumDigitsParity(sp) {
  const s = pad2(sp);
  const n = Number(s[0]) + Number(s[1]);
  if (pad2(sp) === '49') return 'he';
  return n % 2 === 1 ? 'odd' : 'even';
}

function tailSizeSpecial(sp) {
  const d = tailDigit(sp);
  if (pad2(sp) === '49') return 'he';
  return d <= 4 ? 'small' : 'big';
}

function totalSumSeven(balls, special) {
  let t = 0;
  for (const x of balls) t += Number(pad2(x));
  t += Number(pad2(special));
  return t;
}

function totalBigSmall(sum) {
  return sum >= 175 ? 'big' : 'small';
}

function settleTmSize(bet, sp) {
  const v = sizeOfSpecial(sp);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settleTmParity(bet, sp) {
  const v = parityOfSpecial(sp);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settleTmDecade(betHead, sp) {
  return decadeHead(sp) === Number(betHead) ? 'win' : 'lose';
}

function settleTmSumParity(bet, sp) {
  const v = sumDigitsParity(sp);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settleTmTailSize(bet, sp) {
  const v = tailSizeSpecial(sp);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settleTmWave(bet, sp) {
  const w = waveOfCell(sp);
  return w === bet ? 'win' : 'lose';
}

function settlePosWave(bet, cell) {
  const w = waveOfCell(cell);
  if (pad2(cell) === '49') {
    if (bet === 'g') return 'win';
    return 'push';
  }
  return w === bet ? 'win' : 'lose';
}

function sizeOfCell(cell) {
  const n = Number(pad2(cell));
  if (n === 49) return 'he';
  if (n >= 25) return 'big';
  return 'small';
}

function parityOfCell(cell) {
  const n = Number(pad2(cell));
  if (n === 49) return 'he';
  return n % 2 === 1 ? 'odd' : 'even';
}

function sumDigitsCell(cell) {
  const s = pad2(cell);
  if (s === '49') return 'he';
  const n = Number(s[0]) + Number(s[1]);
  return n % 2 === 1 ? 'odd' : 'even';
}

function tailSizeCell(cell) {
  const d = tailDigit(cell);
  if (pad2(cell) === '49') return 'he';
  return d <= 4 ? 'small' : 'big';
}

function settlePosSize(bet, cell) {
  const v = sizeOfCell(cell);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settlePosParity(bet, cell) {
  const v = parityOfCell(cell);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settlePosSumParity(bet, cell) {
  const v = sumDigitsCell(cell);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settlePosTailSize(bet, cell) {
  const v = tailSizeCell(cell);
  if (v === 'he') return 'push';
  return v === bet ? 'win' : 'lose';
}

function settleHalfWave(parts, sp) {
  if (pad2(sp) === '49') return 'push';
  const [color, size, parity] = parts; // red|blue|green, big|small, odd|even
  const w = waveOfCell(sp);
  const sz = sizeOfSpecial(sp);
  const pr = parityOfSpecial(sp);
  if (sz === 'he' || pr === 'he') return 'push';
  if (w === color && sz === size && pr === parity) return 'win';
  return 'lose';
}

function settleSixZodiac(hit, picks, sp) {
  if (pad2(sp) === '49') return 'push';
  const set = new Set(picks);
  const zx = numToZodiacId(sp);
  const got = zx && set.has(zx);
  if (hit) return got ? 'win' : 'lose';
  return got ? 'lose' : 'win';
}

function settleSz7(zid, balls, sp) {
  const bag = new Set([...balls, sp].map(pad2));
  const nums = ZODIAC_NUMS[zid] || [];
  for (const n of nums) if (bag.has(n)) return 'win';
  return 'lose';
}

function settleWz7(tail, balls, sp) {
  const want = new Set(TAIL_NUMS[tail] || []);
  const bag = new Set([...balls, sp].map(pad2));
  for (const n of want) if (bag.has(n)) return 'win';
  return 'lose';
}

function countInMain(picks, mainArr) {
  const mset = new Set(mainArr.map(pad2));
  let c = 0;
  for (const p of picks) if (mset.has(pad2(p))) c += 1;
  return c;
}

function settleSanZhongEr(nums, balls, sp) {
  const main = balls.map(pad2);
  const mset = new Set(main);
  const spec = pad2(sp);
  const hitMain = nums.filter((x) => mset.has(pad2(x)));
  const c = hitMain.length;
  if (c === 3) return { kind: 'zhongsan', win: true };
  if (c === 2) return { kind: 'sanzhonger', win: true };
  return { kind: 'lose', win: false };
}

function settleSanQuanZhong(nums, balls) {
  const mset = new Set(balls.map(pad2));
  for (const x of nums) if (!mset.has(pad2(x))) return false;
  return true;
}

function settleErQuanZhong(nums, balls) {
  const mset = new Set(balls.map(pad2));
  let c = 0;
  for (const x of nums) if (mset.has(pad2(x))) c += 1;
  return c === 2;
}

function settleErZhongTe(nums, balls, sp) {
  const mset = new Set(balls.map(pad2));
  const spec = pad2(sp);
  const a = pad2(nums[0]);
  const b = pad2(nums[1]);
  const inA = mset.has(a);
  const inB = mset.has(b);
  const sa = a === spec;
  const sb = b === spec;
  if (inA && inB && !sa && !sb) return { tier: 'erzhong', win: true };
  if ((inA && sb) || (inB && sa)) return { tier: 'zhongte', win: true };
  return { tier: 'lose', win: false };
}

function settleTeChuan(nums, balls, sp) {
  const mset = new Set(balls.map(pad2));
  const spec = pad2(sp);
  const a = pad2(nums[0]);
  const b = pad2(nums[1]);
  const c1 = (mset.has(a) && b === spec) || (mset.has(b) && a === spec);
  if (mset.has(a) && mset.has(b)) return false;
  return c1;
}

function settleBuZhong(nums, balls, sp) {
  const bag = new Set([...balls, sp].map(pad2));
  for (const x of nums) if (bag.has(pad2(x))) return false;
  return true;
}

function settleZodiacLink(win, count, picks, balls, sp) {
  const zset = zodiacSetFromDraw(balls, sp);
  if (win) {
    for (const p of picks) if (!zset.has(p)) return false;
    return true;
  }
  for (const p of picks) if (zset.has(p)) return false;
  return true;
}

function settleTailLink(win, picks, balls, sp) {
  const tset = tailSetFromDraw(balls, sp);
  const want = picks.map((x) => Number(x));
  if (win) {
    for (const t of want) if (!tset.has(t)) return false;
    return true;
  }
  for (const t of want) if (tset.has(t)) return false;
  return true;
}

/** @returns {{ payout: number }} 派彩额（不含本金）；和局退回 stake 计入 payout+? 用 payout=stake 表示退回 */
function settleLine(key, stake, odds, draw) {
  const balls = draw.balls;
  const sp = draw.special;
  const spad = pad2(sp);
  const parts = String(key).split(':');
  const mult = (o) => (Number(o) > 0 ? stake * Number(o) : 0);

  try {
    if (parts[0] === 'special-ball') {
      const m = /^ball-(\d{2})$/.exec(parts[1] || '');
      if (!m) return { payout: 0 };
      return { payout: spad === m[1] ? mult(odds) : 0 };
    }

    if (parts[0] === 'tm') {
      if (parts[1] === 'size') return payResult(settleTmSize(parts[2], sp), stake, odds);
      if (parts[1] === 'parity') return payResult(settleTmParity(parts[2], sp), stake, odds);
      if (parts[1] === 'decade') {
        const h = decadeHead(sp);
        return { payout: h === Number(parts[2]) ? mult(odds) : 0 };
      }
      if (parts[1] === 'sparity') return payResult(settleTmSumParity(parts[2], sp), stake, odds);
      if (parts[1] === 'tailsz') return payResult(settleTmTailSize(parts[2], sp), stake, odds);
      if (parts[1] === 'wave') return payResult(settleTmWave(parts[2], sp) === 'win' ? 'win' : 'lose', stake, odds);
      if (parts[1] === 'z') return { payout: ZODIAC_NUMS[parts[2]]?.includes(spad) ? mult(odds) : 0 };
      if (parts[1] === 'tail') {
        const d = tailDigit(sp);
        return { payout: d === Number(parts[2]) ? mult(odds) : 0 };
      }
      if (parts[1] === 'fauna') {
        const zx = numToZodiacId(sp);
        if (!zx) return { payout: 0 };
        if (parts[2] === 'poultry') return { payout: POULTRY.has(zx) ? mult(odds) : 0 };
        if (parts[2] === 'beast') return { payout: BEAST.has(zx) ? mult(odds) : 0 };
      }
    }

    if (parts[0] === 'hb') {
      const r = settleHalfWave(parts.slice(1), sp);
      if (r === 'push') return { payout: stake };
      return { payout: r === 'win' ? mult(odds) : 0 };
    }

    if (parts[0] === 'sixz') {
      const hit = parts[1] === 'hit';
      const zs = parts[2].split(',').filter(Boolean);
      const r = settleSixZodiac(hit, zs, sp);
      if (r === 'push') return { payout: stake };
      return { payout: r === 'win' ? mult(odds) : 0 };
    }

    if (parts[0] === 'sz7') return payPlain(settleSz7(parts[1], balls, sp), stake, odds);

    if (parts[0] === 'wz7') return payPlain(settleWz7(Number(parts[1]), balls, sp), stake, odds);

    if (parts[0] === 'ts') {
      const sum = totalSumSeven(balls, sp);
      if (parts[1] === 'size')
        return { payout: totalBigSmall(sum) === parts[2] ? mult(odds) : 0 };
      if (parts[1] === 'parity') {
        const o = sum % 2 === 1 ? 'odd' : 'even';
        return { payout: o === parts[2] ? mult(odds) : 0 };
      }
    }

    if (parts[0].startsWith('n') && /^n[1-6]$/.test(parts[0])) {
      const idx = Number(parts[0][1]) - 1;
      const cell = balls[idx];
      if (parts[1] === 'b') return { payout: pad2(cell) === pad2(parts[2]) ? mult(odds) : 0 };
      if (parts[1] === 'size') return payResult(settlePosSize(parts[2], cell), stake, odds);
      if (parts[1] === 'parity') return payResult(settlePosParity(parts[2], cell), stake, odds);
      if (parts[1] === 'sparity') return payResult(settlePosSumParity(parts[2], cell), stake, odds);
      if (parts[1] === 'tailsz') return payResult(settlePosTailSize(parts[2], cell), stake, odds);
      if (parts[1] === 'wave') {
        const r = settlePosWave(parts[2], cell);
        if (r === 'push') return { payout: stake };
        return { payout: r === 'win' ? mult(odds) : 0 };
      }
    }

    if (parts[0] === 'lm') {
      const kind = parts[1];
      const nums = parts[2].split(',').map(pad2).sort();
      if (kind === 'sz2') {
        const r = settleSanZhongEr(nums, balls, sp);
        if (!r.win) return { payout: 0 };
        if (r.kind === 'zhongsan') return { payout: stake * Number(odds) * 1.25 };
        return { payout: mult(odds) };
      }
      if (kind === 'sz3') return { payout: settleSanQuanZhong(nums, balls) ? mult(odds) : 0 };
      if (kind === 'eq2') return { payout: settleErQuanZhong(nums, balls) ? mult(odds) : 0 };
      if (kind === 'e2t') {
        const r = settleErZhongTe(nums, balls, sp);
        if (!r.win) return { payout: 0 };
        if (r.tier === 'zhongte') return { payout: stake * Number(odds) * 1.12 };
        return { payout: mult(odds) };
      }
      if (kind === 'tc') return { payout: settleTeChuan(nums, balls, sp) ? mult(odds) : 0 };
    }

    if (parts[0] === 'bz') {
      const n = Number(parts[1]);
      const nums = parts[2].split(',').map(pad2).sort();
      if (nums.length !== n) return { payout: 0 };
      return { payout: settleBuZhong(nums, balls, sp) ? mult(odds) : 0 };
    }

    if (parts[0] === 'szl') {
      const cnt = Number(parts[1]);
      const win = parts[2] === 'h';
      const zs = parts[3].split(',').filter(Boolean);
      if (zs.length !== cnt) return { payout: 0 };
      return { payout: settleZodiacLink(win, cnt, zs, balls, sp) ? mult(odds) : 0 };
    }

    if (parts[0] === 'wl') {
      const cnt = Number(parts[1]);
      const win = parts[2] === 'h';
      const ts = parts[3].split(',').map(Number);
      if (ts.length !== cnt) return { payout: 0 };
      return { payout: settleTailLink(win, ts, balls, sp) ? mult(odds) : 0 };
    }

    if (parts[0] === 'main') {
      if (parts[1] === 'size') return payResult(settleTmSize(parts[2], sp), stake, odds);
      if (parts[1] === 'parity') return payResult(settleTmParity(parts[2], sp), stake, odds);
      if (parts[1] === 'combo') {
        const sz = sizeOfSpecial(sp);
        const pr = parityOfSpecial(sp);
        if (sz === 'he' || pr === 'he') return { payout: stake };
        const map = {
          'big-odd': ['big', 'odd'],
          'big-even': ['big', 'even'],
          'small-odd': ['small', 'odd'],
          'small-even': ['small', 'even'],
        };
        const w = map[parts[2]];
        if (!w) return { payout: 0 };
        return { payout: sz === w[0] && pr === w[1] ? mult(odds) : 0 };
      }
    }
  } catch {
    return { payout: 0 };
  }

  return { payout: 0 };
}

function payResult(res, stake, odds) {
  if (res === 'push') return { payout: stake };
  return { payout: res === 'win' ? stake * Number(odds) : 0 };
}

function payPlain(win, stake, odds) {
  return { payout: win ? stake * Number(odds) : 0 };
}

function parseNumsCsv(seg, need) {
  const xs = seg
    .split(',')
    .map((x) => pad2(x))
    .filter((x) => x !== '00' && Number(x) >= 1 && Number(x) <= 49);
  const u = [...new Set(xs)].sort();
  if (u.length !== need) return null;
  return u;
}

function validateHk6Key(key) {
  const k = String(key).trim();
  const parts = k.split(':');
  if (parts.length < 2) return { ok: false, reason: 'bad' };

  if (parts[0] === 'special-ball') {
    const m = /^ball-(\d{2})$/.exec(parts[1] || '');
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 49) return { ok: true };
    return { ok: false };
  }

  if (parts[0] === 'tm') {
    if (parts[1] === 'size' && ['big', 'small'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'parity' && ['odd', 'even'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'decade' && /^[0-4]$/.test(parts[2])) return { ok: true };
    if (parts[1] === 'sparity' && ['odd', 'even'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'tailsz' && ['big', 'small'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'wave' && ['r', 'b', 'g'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'z' && ZODIAC_IDS.includes(parts[2])) return { ok: true };
    if (parts[1] === 'tail' && /^([0-9])$/.test(parts[2])) return { ok: true };
    if (parts[1] === 'fauna' && ['poultry', 'beast'].includes(parts[2])) return { ok: true };
    return { ok: false };
  }

  if (parts[0] === 'hb') {
    if (
      ['r', 'b', 'g'].includes(parts[1]) &&
      ['big', 'small'].includes(parts[2]) &&
      ['odd', 'even'].includes(parts[3])
    )
      return { ok: true };
    return { ok: false };
  }

  if (parts[0] === 'sixz') {
    if (!['hit', 'miss'].includes(parts[1])) return { ok: false };
    const zs = parts[2].split(',').filter(Boolean).sort();
    if (zs.length !== 6) return { ok: false };
    if (!zs.every((z) => ZODIAC_IDS.includes(z))) return { ok: false };
    if (new Set(zs).size !== 6) return { ok: false };
    return { ok: true };
  }

  if (parts[0] === 'sz7' && ZODIAC_IDS.includes(parts[1])) return { ok: true };

  if (parts[0] === 'wz7' && /^([0-9])$/.test(parts[1])) return { ok: true };

  if (parts[0] === 'ts') {
    if (parts[1] === 'size' && ['big', 'small'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'parity' && ['odd', 'even'].includes(parts[2])) return { ok: true };
    return { ok: false };
  }

  if (parts[0].match(/^n[1-6]$/)) {
    if (parts[1] === 'b') {
      const m = /^(\d{2})$/.exec(parts[2] || '');
      if (m && Number(m[1]) >= 1 && Number(m[1]) <= 49) return { ok: true };
      return { ok: false };
    }
    if (parts[1] === 'size' && ['big', 'small'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'parity' && ['odd', 'even'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'sparity' && ['odd', 'even'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'tailsz' && ['big', 'small'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'wave' && ['r', 'b', 'g'].includes(parts[2])) return { ok: true };
    return { ok: false };
  }

  if (parts[0] === 'lm') {
    const need =
      parts[1] === 'sz2' || parts[1] === 'sz3'
        ? 3
        : parts[1] === 'eq2' || parts[1] === 'e2t' || parts[1] === 'tc'
          ? 2
          : 0;
    if (!need || !['sz2', 'sz3', 'eq2', 'e2t', 'tc'].includes(parts[1])) return { ok: false };
    const nums = parseNumsCsv(parts[2] || '', need);
    return nums ? { ok: true } : { ok: false };
  }

  if (parts[0] === 'bz') {
    const n = Number(parts[1]);
    if (![5, 6, 7, 8, 9, 10].includes(n)) return { ok: false };
    const nums = parseNumsCsv(parts[2] || '', n);
    return nums ? { ok: true } : { ok: false };
  }

  if (parts[0] === 'szl') {
    const cnt = Number(parts[1]);
    if (![2, 3, 4].includes(cnt)) return { ok: false };
    if (!['h', 'nh'].includes(parts[2])) return { ok: false };
    const zs = (parts[3] || '').split(',').filter(Boolean).sort();
    if (zs.length !== cnt || !zs.every((z) => ZODIAC_IDS.includes(z))) return { ok: false };
    if (new Set(zs).size !== cnt) return { ok: false };
    return { ok: true };
  }

  if (parts[0] === 'wl') {
    const cnt = Number(parts[1]);
    if (![2, 3, 4].includes(cnt)) return { ok: false };
    if (!['h', 'nh'].includes(parts[2])) return { ok: false };
    const ts = (parts[3] || '').split(',').map(Number);
    if (ts.length !== cnt || ts.some((t) => t < 0 || t > 9)) return { ok: false };
    if (new Set(ts).size !== cnt) return { ok: false };
    return { ok: true };
  }

  if (parts[0] === 'main') {
    if (parts[1] === 'size' && ['big', 'small'].includes(parts[2])) return { ok: true };
    if (parts[1] === 'parity' && ['odd', 'even'].includes(parts[2])) return { ok: true };
    if (
      parts[1] === 'combo' &&
      ['big-odd', 'big-even', 'small-odd', 'small-even'].includes(parts[2])
    )
      return { ok: true };
    return { ok: false };
  }

  return { ok: false };
}

function getDefaultOdds(key) {
  const parts = String(key).split(':');

  if (parts[0] === 'special-ball') return 42;
  if (parts[0] === 'tm') {
    if (parts[1] === 'z' || parts[1] === 'tail') return 11;
    if (parts[1] === 'fauna') return 1.98;
    return 1.98;
  }
  if (parts[0] === 'hb') return 5.5;
  if (parts[0] === 'sixz') return 12;
  if (parts[0] === 'sz7') return 2.8;
  if (parts[0] === 'wz7') return 2.8;
  if (parts[0] === 'ts') return 1.98;
  if (parts[0].match(/^n[1-6]$/)) {
    if (parts[1] === 'b') return 42;
    return 1.92;
  }
  if (parts[0] === 'lm') {
    if (parts[1] === 'sz2') return 8;
    if (parts[1] === 'sz3') return 600;
    if (parts[1] === 'eq2') return 60;
    if (parts[1] === 'e2t') return 80;
    if (parts[1] === 'tc') return 100;
  }
  if (parts[0] === 'bz') {
    const n = Number(parts[1]);
    const t = { 5: 12, 6: 20, 7: 35, 8: 60, 9: 90, 10: 150 };
    return t[n] || 12;
  }
  if (parts[0] === 'szl') return { 2: 4, 3: 12, 4: 40 }[Number(parts[1])] || 4;
  if (parts[0] === 'wl') return { 2: 4.5, 3: 12, 4: 42 }[Number(parts[1])] || 4;
  if (parts[0] === 'main') {
    if (parts[1] === 'combo') return 4.2;
    return 1.98;
  }
  return 1.98;
}

const ZODIAC_ZH = {
  rat: '鼠',
  ox: '牛',
  tiger: '虎',
  rabbit: '兔',
  dragon: '龙',
  snake: '蛇',
  horse: '马',
  goat: '羊',
  monkey: '猴',
  rooster: '鸡',
  dog: '狗',
  pig: '猪',
};

function waveZhLetter(w) {
  return { r: '红', b: '蓝', g: '绿' }[w] || '';
}

function sizeParityZh(v, kind) {
  if (kind === 'size') return { big: '大', small: '小', he: '和' }[v] || String(v);
  return { odd: '单', even: '双', he: '和' }[v] || String(v);
}

/** 单粒球：正码/特码通用形态（正码盘大小单双用 sizeOfCell） */
function cellFacet(cell) {
  const p = pad2(cell);
  const zid = numToZodiacId(p);
  const w = waveOfCell(p);
  const sz = sizeOfCell(p);
  const pr = parityOfCell(p);
  return {
    num: p,
    zodiacId: zid,
    zodiac: zid ? ZODIAC_ZH[zid] : null,
    wave: w,
    waveZh: waveZhLetter(w),
    size: sz,
    sizeZh: sizeParityZh(sz, 'size'),
    parity: pr,
    parityZh: sizeParityZh(pr, 'parity'),
    decade: decadeHead(p),
    tail: tailDigit(p),
    sumDigitsParity: sumDigitsCell(p),
    sumDigitsParityZh: sizeParityZh(sumDigitsCell(p), 'parity'),
    tailSize: tailSizeCell(p),
    tailSizeZh: sizeParityZh(tailSizeCell(p), 'size'),
  };
}

/** 特码专用：主势盘大小单双、半波、组合等与规则 settle* 一致 */
function specialFacet(sp) {
  const p = pad2(sp);
  const w = waveOfCell(p);
  const sz = sizeOfSpecial(p);
  const pr = parityOfSpecial(p);
  const zid = numToZodiacId(p);
  let comboKey = null;
  let comboZh = null;
  if (sz !== 'he' && pr !== 'he') {
    comboKey = `${sz}-${pr}`;
    comboZh = `${sizeParityZh(sz, 'size')}${sizeParityZh(pr, 'parity')}`;
  }
  let halfWaveKey = null;
  let halfWaveZh = null;
  if (p !== '49' && sz !== 'he' && pr !== 'he') {
    halfWaveKey = `${w}:${sz}:${pr}`;
    halfWaveZh = `${waveZhLetter(w)}${sizeParityZh(sz, 'size')}${sizeParityZh(pr, 'parity')}`;
  }
  return {
    num: p,
    zodiacId: zid,
    zodiac: zid ? ZODIAC_ZH[zid] : null,
    wave: w,
    waveZh: waveZhLetter(w),
    size: sz,
    sizeZh: sizeParityZh(sz, 'size'),
    parity: pr,
    parityZh: sizeParityZh(pr, 'parity'),
    comboKey,
    comboZh,
    halfWaveKey,
    halfWaveZh,
    decade: decadeHead(p),
    tail: tailDigit(p),
    sumDigitsParity: sumDigitsParity(p),
    sumDigitsParityZh: sizeParityZh(sumDigitsParity(p), 'parity'),
    tailSize: tailSizeSpecial(p),
    tailSizeZh: sizeParityZh(tailSizeSpecial(p), 'size'),
  };
}

/**
 * 开奖号码派生信息（供前端与历史接口展示；与 hkMarkSixRules 结算键一致）
 */
function expandDrawForApi(balls, special) {
  const sp = pad2(special);
  const main = (balls || []).map((c) => cellFacet(c));
  const spec = specialFacet(sp);
  const sum = totalSumSeven(balls, special);
  const tbs = totalBigSmall(sum);
  const bagNums = [...(balls || []).map(pad2), sp];
  const zodiacIds = [...new Set(bagNums.map((n) => numToZodiacId(n)).filter(Boolean))];
  const zodiacsInDraw = zodiacIds.map((id) => ({ id, name: ZODIAC_ZH[id] }));
  const tailDigitsInDraw = [...new Set(bagNums.map((n) => tailDigit(n)))].sort((a, b) => a - b);
  return {
    main,
    special: spec,
    totalSumSeven: sum,
    totalSizeSeven: tbs,
    totalSizeSevenZh: tbs === 'big' ? '大' : '小',
    zodiacsInDraw,
    tailDigitsInDraw,
  };
}

module.exports = {
  ZODIAC_IDS,
  ZODIAC_NUMS,
  pad2,
  validateHk6Key,
  settleLine,
  getDefaultOdds,
  numToZodiacId,
  expandDrawForApi,
};
