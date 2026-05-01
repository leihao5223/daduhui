/**
 * 香港六合彩玩法目录（与 server/hkMarkSixRules.js 键格式一致，赔率为演示值）
 */
export type MarkSixOption = {
  id: string;
  label: string;
  odds: number;
};

export type MarkSixPlayType = {
  id: string;
  name: string;
  options: MarkSixOption[];
};

export type MarkSixCategory = {
  id: string;
  name: string;
  playTypes: MarkSixPlayType[];
};

const ODDS = {
  side: 1.98,
  combo4: 4.2,
  ball: 42,
  z7: 2.8,
  half: 5.5,
  sixZ: 12,
  posSide: 1.92,
};

const zodiacMeta: { id: string; label: string }[] = [
  { id: 'rat', label: '鼠' },
  { id: 'ox', label: '牛' },
  { id: 'tiger', label: '虎' },
  { id: 'rabbit', label: '兔' },
  { id: 'dragon', label: '龙' },
  { id: 'snake', label: '蛇' },
  { id: 'horse', label: '马' },
  { id: 'goat', label: '羊' },
  { id: 'monkey', label: '猴' },
  { id: 'rooster', label: '鸡' },
  { id: 'dog', label: '狗' },
  { id: 'pig', label: '猪' },
];

function halfWaveOptions(): MarkSixOption[] {
  const out: MarkSixOption[] = [];
  const cols: [string, string][] = [
    ['r', '红'],
    ['b', '蓝'],
    ['g', '绿'],
  ];
  const sz: [string, string][] = [
    ['big', '大'],
    ['small', '小'],
  ];
  const pr: [string, string][] = [
    ['odd', '单'],
    ['even', '双'],
  ];
  for (const [c, cn] of cols) {
    for (const [s, sn] of sz) {
      for (const [p, pn] of pr) {
        out.push({
          id: `${c}:${s}:${p}`,
          label: `${cn}${sn}${pn}`,
          odds: ODDS.half,
        });
      }
    }
  }
  return out;
}

const cats: MarkSixCategory[] = [];

cats.push({
  id: 'main',
  name: '主势盘',
  playTypes: [
    {
      id: 'main:size',
      name: '特码大小',
      options: [
        { id: 'big', label: '大', odds: ODDS.side },
        { id: 'small', label: '小', odds: ODDS.side },
      ],
    },
    {
      id: 'main:parity',
      name: '特码单双',
      options: [
        { id: 'odd', label: '单', odds: ODDS.side },
        { id: 'even', label: '双', odds: ODDS.side },
      ],
    },
    {
      id: 'main:combo',
      name: '特码组合',
      options: [
        { id: 'big-odd', label: '大单', odds: ODDS.combo4 },
        { id: 'big-even', label: '大双', odds: ODDS.combo4 },
        { id: 'small-odd', label: '小单', odds: ODDS.combo4 },
        { id: 'small-even', label: '小双', odds: ODDS.combo4 },
      ],
    },
  ],
});

cats.push({
  id: 'tm-extra',
  name: '特码头尾',
  playTypes: [
    {
      id: 'tm:decade',
      name: '特码头（0-4头）',
      options: [0, 1, 2, 3, 4].map((h) => ({ id: String(h), label: `${h}头`, odds: ODDS.side })),
    },
    {
      id: 'tm:tailsz',
      name: '特码尾数大小',
      options: [
        { id: 'big', label: '尾大', odds: ODDS.side },
        { id: 'small', label: '尾小', odds: ODDS.side },
      ],
    },
    {
      id: 'tm:sparity',
      name: '特码合数单双',
      options: [
        { id: 'odd', label: '合单', odds: ODDS.side },
        { id: 'even', label: '合双', odds: ODDS.side },
      ],
    },
    {
      id: 'tm:wave',
      name: '特码波色',
      options: [
        { id: 'r', label: '红波', odds: ODDS.side },
        { id: 'b', label: '蓝波', odds: ODDS.side },
        { id: 'g', label: '绿波', odds: ODDS.side },
      ],
    },
    {
      id: 'tm:tail',
      name: '特码尾数',
      options: Array.from({ length: 10 }, (_, d) => ({
        id: String(d),
        label: `${d}尾`,
        odds: 11,
      })),
    },
  ],
});

cats.push({
  id: 'tm-zodiac',
  name: '特码生肖',
  playTypes: [
    {
      id: 'tm:z',
      name: '特码生肖',
      options: zodiacMeta.map((z) => ({ id: z.id, label: z.label, odds: 11 })),
    },
    {
      id: 'tm:fauna',
      name: '家禽 / 野兽',
      options: [
        { id: 'poultry', label: '家禽', odds: ODDS.side },
        { id: 'beast', label: '野兽', odds: ODDS.side },
      ],
    },
  ],
});

cats.push({
  id: 'hb',
  name: '半波',
  playTypes: [
    {
      id: 'hb',
      name: '半波（色+大小+单双）',
      options: halfWaveOptions(),
    },
  ],
});

cats.push({
  id: 'sum',
  name: '总分',
  playTypes: [
    {
      id: 'ts:size',
      name: '总分大小',
      options: [
        { id: 'big', label: '总和大(≥175)', odds: ODDS.side },
        { id: 'small', label: '总和小(≤174)', odds: ODDS.side },
      ],
    },
    {
      id: 'ts:parity',
      name: '总和单双',
      options: [
        { id: 'odd', label: '总和单', odds: ODDS.side },
        { id: 'even', label: '总和双', odds: ODDS.side },
      ],
    },
  ],
});

cats.push({
  id: 'sz7',
  name: '生肖七码',
  playTypes: [
    {
      id: 'sz7',
      name: '七码含肖（派彩一次）',
      options: zodiacMeta.map((z) => ({ id: z.id, label: z.label, odds: ODDS.z7 })),
    },
  ],
});

cats.push({
  id: 'wz7',
  name: '尾数七码',
  playTypes: [
    {
      id: 'wz7',
      name: '七码含尾（派彩一次）',
      options: Array.from({ length: 10 }, (_, d) => ({
        id: String(d),
        label: `${d}尾`,
        odds: ODDS.z7,
      })),
    },
  ],
});

for (let i = 1; i <= 6; i += 1) {
  const playTypes: MarkSixPlayType[] = [
    {
      id: `n${i}:size`,
      name: `正码${i}大小`,
      options: [
        { id: 'big', label: '大', odds: ODDS.posSide },
        { id: 'small', label: '小', odds: ODDS.posSide },
      ],
    },
    {
      id: `n${i}:parity`,
      name: `正码${i}单双`,
      options: [
        { id: 'odd', label: '单', odds: ODDS.posSide },
        { id: 'even', label: '双', odds: ODDS.posSide },
      ],
    },
    {
      id: `n${i}:sparity`,
      name: `正码${i}合数单双`,
      options: [
        { id: 'odd', label: '合单', odds: ODDS.posSide },
        { id: 'even', label: '合双', odds: ODDS.posSide },
      ],
    },
    {
      id: `n${i}:tailsz`,
      name: `正码${i}尾数大小`,
      options: [
        { id: 'big', label: '尾大', odds: ODDS.posSide },
        { id: 'small', label: '尾小', odds: ODDS.posSide },
      ],
    },
    {
      id: `n${i}:wave`,
      name: `正码${i}波色`,
      options: [
        { id: 'r', label: '红', odds: ODDS.posSide },
        { id: 'b', label: '蓝', odds: ODDS.posSide },
        { id: 'g', label: '绿', odds: ODDS.posSide },
      ],
    },
    {
      id: `n${i}:b`,
      name: `正码${i}特（顺位）`,
      options: Array.from({ length: 49 }, (_, j) => {
        const n = String(j + 1).padStart(2, '0');
        return { id: n, label: n, odds: ODDS.ball };
      }),
    },
  ];
  cats.push({
    id: `norm-${i}`,
    name: `正码${i}`,
    playTypes,
  });
}

cats.push({
  id: 'special',
  name: '特码号',
  playTypes: [
    {
      id: 'special-ball',
      name: '特码（1-49）',
      options: Array.from({ length: 49 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return { id: `ball-${n}`, label: n, odds: ODDS.ball };
      }),
    },
  ],
});

cats.push({
  id: 'combo',
  name: '复式',
  playTypes: [],
});

export const hkMarkSixPlayCatalog: MarkSixCategory[] = cats;

export type ComboModeId =
  | 'lm-sz2'
  | 'lm-sz3'
  | 'lm-eq2'
  | 'lm-e2t'
  | 'lm-tc'
  | 'bz-5'
  | 'bz-6'
  | 'bz-7'
  | 'bz-8'
  | 'bz-9'
  | 'bz-10'
  | 'szl-2h'
  | 'szl-2nh'
  | 'szl-3h'
  | 'szl-3nh'
  | 'szl-4h'
  | 'szl-4nh'
  | 'wl-2h'
  | 'wl-2nh'
  | 'wl-3h'
  | 'wl-3nh'
  | 'wl-4h'
  | 'wl-4nh'
  | 'sixz-hit'
  | 'sixz-miss';

export const hkComboModes: {
  id: ComboModeId;
  label: string;
  hint: string;
}[] = [
  { id: 'lm-sz2', label: '三中二', hint: '选 3 个号，2 个在前 6 个正码为中；3 个皆正码为中三' },
  { id: 'lm-sz3', label: '三全中', hint: '选 3 个号，须皆为正码（不含特码）' },
  { id: 'lm-eq2', label: '二全中', hint: '选 2 个号，须皆为正码' },
  { id: 'lm-e2t', label: '二中特', hint: '选 2 个号：二中 / 中特 不同赔付' },
  { id: 'lm-tc', label: '特串', hint: '选 2 个号：一正码 + 一特码' },
  { id: 'bz-5', label: '五不中', hint: '选 5 个号，七码皆不在其中' },
  { id: 'bz-6', label: '六不中', hint: '选 6 个号' },
  { id: 'bz-7', label: '七不中', hint: '选 7 个号' },
  { id: 'bz-8', label: '八不中', hint: '选 8 个号' },
  { id: 'bz-9', label: '九不中', hint: '选 9 个号' },
  { id: 'bz-10', label: '十不中', hint: '选 10 个号' },
  { id: 'szl-2h', label: '二肖连(中)', hint: '选 2 生肖，须皆出现在 7 个开奖号对应生肖' },
  { id: 'szl-2nh', label: '二肖连(不中)', hint: '选 2 生肖，皆不得出现' },
  { id: 'szl-3h', label: '三肖连(中)', hint: '选 3 生肖' },
  { id: 'szl-3nh', label: '三肖连(不中)', hint: '选 3 生肖' },
  { id: 'szl-4h', label: '四肖连(中)', hint: '选 4 生肖' },
  { id: 'szl-4nh', label: '四肖连(不中)', hint: '选 4 生肖' },
  { id: 'wl-2h', label: '二尾连(中)', hint: '选 2 个尾数' },
  { id: 'wl-2nh', label: '二尾连(不中)', hint: '选 2 个尾数' },
  { id: 'wl-3h', label: '三尾连(中)', hint: '选 3 个尾数' },
  { id: 'wl-3nh', label: '三尾连(不中)', hint: '选 3 个尾数' },
  { id: 'wl-4h', label: '四尾连(中)', hint: '选 4 个尾数' },
  { id: 'wl-4nh', label: '四尾连(不中)', hint: '选 4 个尾数' },
  { id: 'sixz-hit', label: '六肖(中)', hint: '选 6 生肖，特码肖在其中' },
  { id: 'sixz-miss', label: '六肖(不中)', hint: '选 6 生肖，特码肖不在其中' },
];

export function lineKey(playTypeId: string, optionId: string): string {
  return `${playTypeId}:${optionId}`;
}

export function buildComboKey(mode: ComboModeId, picks: string[]): string | null {
  const nums = [...picks].map((x) => String(x).padStart(2, '0')).filter((x) => Number(x) >= 1 && Number(x) <= 49);
  const uniqNum = [...new Set(nums)].sort();
  const zids = [...new Set(picks)].filter((z) => zodiacMeta.some((m) => m.id === z));
  const tails = [...new Set(picks.map(Number))].filter(
    (t) => !Number.isNaN(t) && Number.isInteger(t) && t >= 0 && t <= 9,
  );

  switch (mode) {
    case 'lm-sz2':
      if (uniqNum.length !== 3) return null;
      return `lm:sz2:${uniqNum.join(',')}`;
    case 'lm-sz3':
      if (uniqNum.length !== 3) return null;
      return `lm:sz3:${uniqNum.join(',')}`;
    case 'lm-eq2':
      if (uniqNum.length !== 2) return null;
      return `lm:eq2:${uniqNum.join(',')}`;
    case 'lm-e2t':
      if (uniqNum.length !== 2) return null;
      return `lm:e2t:${uniqNum.join(',')}`;
    case 'lm-tc':
      if (uniqNum.length !== 2) return null;
      return `lm:tc:${uniqNum.join(',')}`;
    case 'bz-5':
    case 'bz-6':
    case 'bz-7':
    case 'bz-8':
    case 'bz-9':
    case 'bz-10': {
      const n = Number(mode.split('-')[1]);
      if (uniqNum.length !== n) return null;
      return `bz:${n}:${uniqNum.join(',')}`;
    }
    case 'szl-2h':
      if (zids.length !== 2) return null;
      return `szl:2:h:${[...zids].sort().join(',')}`;
    case 'szl-2nh':
      if (zids.length !== 2) return null;
      return `szl:2:nh:${[...zids].sort().join(',')}`;
    case 'szl-3h':
      if (zids.length !== 3) return null;
      return `szl:3:h:${[...zids].sort().join(',')}`;
    case 'szl-3nh':
      if (zids.length !== 3) return null;
      return `szl:3:nh:${[...zids].sort().join(',')}`;
    case 'szl-4h':
      if (zids.length !== 4) return null;
      return `szl:4:h:${[...zids].sort().join(',')}`;
    case 'szl-4nh':
      if (zids.length !== 4) return null;
      return `szl:4:nh:${[...zids].sort().join(',')}`;
    case 'wl-2h':
      if (tails.length !== 2) return null;
      return `wl:2:h:${[...tails].sort((a, b) => a - b).join(',')}`;
    case 'wl-2nh':
      if (tails.length !== 2) return null;
      return `wl:2:nh:${[...tails].sort((a, b) => a - b).join(',')}`;
    case 'wl-3h':
      if (tails.length !== 3) return null;
      return `wl:3:h:${[...tails].sort((a, b) => a - b).join(',')}`;
    case 'wl-3nh':
      if (tails.length !== 3) return null;
      return `wl:3:nh:${[...tails].sort((a, b) => a - b).join(',')}`;
    case 'wl-4h':
      if (tails.length !== 4) return null;
      return `wl:4:h:${[...tails].sort((a, b) => a - b).join(',')}`;
    case 'wl-4nh':
      if (tails.length !== 4) return null;
      return `wl:4:nh:${[...tails].sort((a, b) => a - b).join(',')}`;
    case 'sixz-hit':
      if (zids.length !== 6) return null;
      return `sixz:hit:${[...zids].sort().join(',')}`;
    case 'sixz-miss':
      if (zids.length !== 6) return null;
      return `sixz:miss:${[...zids].sort().join(',')}`;
    default:
      return null;
  }
}

export { zodiacMeta };
