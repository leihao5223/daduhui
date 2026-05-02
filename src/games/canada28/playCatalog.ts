/**
 * Play catalog; bet keys use prefix ca28:<kind>:<value>.
 */

export type Ca28PlayOption = { key: string; label: string; odds: string };
export type Ca28PlayType = { id: string; name: string; options: Ca28PlayOption[] };
export type Ca28Category = { id: string; name: string; playTypes: Ca28PlayType[] };

const DXDS: Ca28PlayType[] = [
  {
    id: 'dx',
    name: '大小',
    options: [
      { key: 'ca28:dx:big', label: '大', odds: '2.0' },
      { key: 'ca28:dx:small', label: '小', odds: '2.0' },
    ],
  },
  {
    id: 'ds',
    name: '单双',
    options: [
      { key: 'ca28:ds:odd', label: '单', odds: '2.0' },
      { key: 'ca28:ds:even', label: '双', odds: '2.0' },
    ],
  },
];

const ZH: Ca28PlayType[] = [
  {
    id: 'zh',
    name: '组合',
    options: [
      { key: 'ca28:zh:xd', label: '小单', odds: '4.6' },
      { key: 'ca28:zh:ds', label: '大双', odds: '4.6' },
      { key: 'ca28:zh:xs', label: '小双', odds: '4.2' },
      { key: 'ca28:zh:dd', label: '大单', odds: '4.2' },
    ],
  },
];

const JZ: Ca28PlayType[] = [
  {
    id: 'jx',
    name: '极值',
    options: [
      { key: 'ca28:jx:max', label: '极大', odds: '15' },
      { key: 'ca28:jx:min', label: '极小', odds: '15' },
    ],
  },
];

const TM_OPTS: Ca28PlayOption[] = Array.from({ length: 28 }, (_, i) => ({
  key: `ca28:tm:${i}`,
  label: String(i).padStart(2, '0'),
  odds: '198',
}));

const TM: Ca28PlayType[] = [{ id: 'tm', name: '特码（和值）', options: TM_OPTS }];

const XT: Ca28PlayType[] = [
  {
    id: 'xt',
    name: '形态',
    options: [
      { key: 'ca28:bz:yes', label: '豹子', odds: '88' },
      { key: 'ca28:sz:yes', label: '顺子', odds: '12' },
      { key: 'ca28:dz:yes', label: '对子', odds: '3.5' },
    ],
  },
];

export const canada28PlayCatalog: Ca28Category[] = [
  { id: 'dxds', name: '大小单双', playTypes: DXDS },
  { id: 'zuhe', name: '组合', playTypes: ZH },
  { id: 'jizhi', name: '极值', playTypes: JZ },
  { id: 'tema', name: '特码', playTypes: TM },
  { id: 'xingtai', name: '形态', playTypes: XT },
];
