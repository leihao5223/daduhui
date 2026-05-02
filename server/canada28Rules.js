/**
 * Rules and settlement (odds include principal; payout gross = stake × multiplier).
 */

const BIG_SUM = new Set(
  [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map((n) => n),
);
const SMALL_SUM = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

const DAN_DA = new Set([15, 17, 19, 21, 23, 25, 27]);
const DAN_XIAO = new Set([1, 3, 5, 7, 9, 11, 13]);
const SHUANG_DA = new Set([14, 16, 18, 20, 22, 24, 26]);
const SHUANG_XIAO = new Set([0, 2, 4, 6, 8, 10, 12]);

const JI_DA = new Set([22, 23, 24, 25, 26, 27]);
const JI_XIAO = new Set([0, 1, 2, 3, 4, 5]);

function normDigit(x) {
  const n = Math.trunc(Number(String(x).trim()));
  if (!Number.isFinite(n) || n < 0 || n > 9) return null;
  return n;
}

function parseDraw(draw) {
  if (!draw || !Array.isArray(draw.digits) || draw.digits.length !== 3) return null;
  const d = draw.digits.map(normDigit);
  if (d.some((x) => x == null)) return null;
  return [d[0], d[1], d[2]];
}

function expandDrawForApi(draw) {
  const p = parseDraw(draw);
  if (!p) return null;
  const [a, b, c] = p;
  const sum = a + b + c;
  const sorted = [...p].sort((x, y) => x - y);
  const straight = sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
  const triple = a === b && b === c;
  const pair =
    !triple &&
    ((a === b && a !== c) || (a === c && a !== b) || (b === c && b !== a));

  const big = BIG_SUM.has(sum);
  const small = SMALL_SUM.has(sum);
  const odd = sum % 2 === 1;
  const even = !odd;

  let combo = null;
  if (DAN_DA.has(sum)) combo = '大单';
  else if (DAN_XIAO.has(sum)) combo = '小单';
  else if (SHUANG_DA.has(sum)) combo = '大双';
  else if (SHUANG_XIAO.has(sum)) combo = '小双';

  return {
    sum,
    digits: [String(a), String(b), String(c)],
    big,
    small,
    odd,
    even,
    comboZh: combo,
    jiDa: JI_DA.has(sum),
    jiXiao: JI_XIAO.has(sum),
    baoZi: triple,
    shunZi: straight && !triple,
    duiZi: pair,
  };
}

function validateKey(key) {
  const k = String(key || '').trim();
  const m = /^ca28:([^:]+):(.+)$/.exec(k);
  if (!m) return { ok: false, message: '无效注项' };
  const [, kind, val] = m;
  const allowed = new Set([
    'dx',
    'ds',
    'zh',
    'jx',
    'tm',
    'bz',
    'sz',
    'dz',
  ]);
  if (!allowed.has(kind)) return { ok: false, message: '无效玩法' };
  if (kind === 'dx' && !['big', 'small'].includes(val)) return { ok: false, message: '大小无效' };
  if (kind === 'ds' && !['odd', 'even'].includes(val)) return { ok: false, message: '单双无效' };
  if (kind === 'zh' && !['xd', 'ds', 'xs', 'dd'].includes(val)) return { ok: false, message: '组合无效' };
  if (kind === 'jx' && !['max', 'min'].includes(val)) return { ok: false, message: '极值无效' };
  if (kind === 'tm') {
    const n = Number(val);
    if (!Number.isInteger(n) || n < 0 || n > 27) return { ok: false, message: '特码和值须 0–27' };
  }
  if (['bz', 'sz', 'dz'].includes(kind) && val !== 'yes') return { ok: false, message: '形态投注无效' };
  return { ok: true };
}

function getBaseOdds(key) {
  const m = /^ca28:([^:]+):(.+)$/.exec(String(key || '').trim());
  if (!m) return 2;
  const [, kind] = m;
  if (kind === 'dx' || kind === 'ds') return 2.0;
  if (kind === 'zh') {
    const v = m[2];
    if (v === 'xd' || v === 'ds') return 4.6;
    return 4.2;
  }
  if (kind === 'jx') return 15;
  if (kind === 'tm') return 198;
  if (kind === 'bz') return Number(process.env.CA28_ODDS_BAOZI || 88);
  if (kind === 'sz') return Number(process.env.CA28_ODDS_SHUNZI || 12);
  if (kind === 'dz') return Number(process.env.CA28_ODDS_DUIZI || 3.5);
  return 2;
}

/** 遇 13/14：大小单双有效倍数（含本金），取决于当期总投注额 T */
function dxDsMultiplierFor1314(periodTotalStake) {
  const T = Number(periodTotalStake) || 0;
  if (T <= 4999) return 1.6;
  if (T <= 9999) return 1.2;
  if (T <= 29999) return 1.0;
  return 0;
}

/** 遇 13/14：组合有效倍数（含本金） */
function comboMultiplierFor1314(periodTotalStake) {
  const T = Number(periodTotalStake) || 0;
  if (T <= 29999) return 1.0;
  return 0;
}

function settleLine(key, stake, draw, periodTotalStake) {
  const p = parseDraw(draw);
  if (!p) return { gross: 0 };
  const [a, b, c] = p;
  const sum = a + b + c;
  const ex = expandDrawForApi(draw);
  const k = String(key || '').trim();
  const m = /^ca28:([^:]+):(.+)$/.exec(k);
  if (!m) return { gross: 0 };
  const [, kind, val] = m;
  const base = getBaseOdds(k);
  let mult = base;

  const special1314 = sum === 13 || sum === 14;

  if (kind === 'dx' || kind === 'ds') {
    if (special1314) mult = dxDsMultiplierFor1314(periodTotalStake);
    else mult = 2.0;
    let win = false;
    if (kind === 'dx') win = val === 'big' ? ex.big : ex.small;
    else win = val === 'odd' ? ex.odd : ex.even;
    return { gross: win ? stake * mult : 0 };
  }

  if (kind === 'zh') {
    if (special1314) mult = comboMultiplierFor1314(periodTotalStake);
    else mult = val === 'xd' || val === 'ds' ? 4.6 : 4.2;
    const win =
      (val === 'xd' && ex.comboZh === '小单') ||
      (val === 'ds' && ex.comboZh === '大双') ||
      (val === 'xs' && ex.comboZh === '小双') ||
      (val === 'dd' && ex.comboZh === '大单');
    return { gross: win ? stake * mult : 0 };
  }

  if (kind === 'jx') {
    mult = 15;
    const win =
      (val === 'max' && ex.jiDa) || (val === 'min' && ex.jiXiao);
    return { gross: win ? stake * mult : 0 };
  }

  if (kind === 'tm') {
    mult = 198;
    const n = Number(val);
    return { gross: n === sum ? stake * mult : 0 };
  }

  if (kind === 'bz') {
    mult = getBaseOdds(k);
    return { gross: ex.baoZi ? stake * mult : 0 };
  }
  if (kind === 'sz') {
    mult = getBaseOdds(k);
    return { gross: ex.shunZi ? stake * mult : 0 };
  }
  if (kind === 'dz') {
    mult = getBaseOdds(k);
    return { gross: ex.duiZi ? stake * mult : 0 };
  }
  return { gross: 0 };
}

/** 单期单个玩法维度封顶（元） */
const CAP_DXDS = 200_000;
const CAP_ZH = 100_000;
const CAP_JX = 20_000;
const CAP_TOTAL = 300_000;

function capForKey(key) {
  const m = /^ca28:([^:]+):/.exec(String(key || '').trim());
  if (!m) return CAP_TOTAL;
  const kind = m[1];
  if (kind === 'dx' || kind === 'ds') return CAP_DXDS;
  if (kind === 'zh') return CAP_ZH;
  if (kind === 'jx') return CAP_JX;
  return CAP_TOTAL;
}

module.exports = {
  expandDrawForApi,
  validateKey,
  getBaseOdds,
  settleLine,
  capForKey,
  CAP_TOTAL,
};
