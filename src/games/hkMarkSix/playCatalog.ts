/**
 * 香港六合彩玩法目录（可随规则扩展；赔率为演示值）
 */
export type MarkSixOption = {
  id: string;
  label: string;
  /** 演示赔率，后端接入后亦可由接口覆盖 */
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

export const hkMarkSixPlayCatalog: MarkSixCategory[] = [
  {
    id: 'main',
    name: '主势盘',
    playTypes: [
      {
        id: 'main-size',
        name: '大小',
        options: [
          { id: 'big', label: '大', odds: 1.98 },
          { id: 'small', label: '小', odds: 1.98 },
        ],
      },
      {
        id: 'main-parity',
        name: '单双',
        options: [
          { id: 'odd', label: '单', odds: 1.98 },
          { id: 'even', label: '双', odds: 1.98 },
        ],
      },
      {
        id: 'main-combo',
        name: '组合',
        options: [
          { id: 'big-odd', label: '大单', odds: 4.2 },
          { id: 'big-even', label: '大双', odds: 4.2 },
          { id: 'small-odd', label: '小单', odds: 4.2 },
          { id: 'small-even', label: '小双', odds: 4.2 },
        ],
      },
    ],
  },
  {
    id: 'special',
    name: '特码',
    playTypes: [
      {
        id: 'special-ball',
        name: '特码（示例号段）',
        options: Array.from({ length: 12 }, (_, i) => {
          const n = String(i + 1).padStart(2, '0');
          return { id: `ball-${n}`, label: n, odds: 42 };
        }),
      },
    ],
  },
];

export function lineKey(playTypeId: string, optionId: string): string {
  return `${playTypeId}:${optionId}`;
}
