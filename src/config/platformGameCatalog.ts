/**
 * 平台游戏列表唯一数据源：首页分区与代理中心抽佣游戏与此对齐。
 */
import {
  gameCanada28,
  gameHongkong,
  gameRacing,
  sportsComprehensive,
} from '../gameAssets';

export type PlatformGameEntry = {
  /** 稳定 key，用于邀请码返佣 JSON、后端存储 */
  id: string;
  name: string;
  image: string;
  tag: string;
  /** 游戏大厅路由（完整路径，如 `/game/hk-marksix`） */
  hallPath?: string;
};

export type PlatformCategoryEntry = {
  id: string;
  title: string;
  sectionClass: string;
  games: PlatformGameEntry[];
};

export const platformGameCategories: PlatformCategoryEntry[] = [
  {
    id: 'hot',
    title: '热门游戏',
    sectionClass: 'category-section--hot',
    games: [
      { id: 'hot-hk-lotto', name: '香港六合彩', image: gameHongkong, tag: 'HOT', hallPath: '/game/hk-marksix' },
      { id: 'hot-canada-28', name: 'PC28', image: gameCanada28, tag: 'HOT', hallPath: '/game/canada-28' },
      { id: 'hot-speed-racing', name: '急速赛车', image: gameRacing, tag: '', hallPath: '/game/speed-racing' },
    ],
  },
  {
    id: 'sports-center',
    title: '体育中心',
    sectionClass: 'category-section--hot',
    games: [
      {
        id: 'sports-football',
        name: '足球赛事',
        image:
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=85',
        tag: '',
      },
      {
        id: 'sports-basketball',
        name: '篮球直播',
        image:
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1920&q=85',
        tag: 'HOT',
      },
      {
        id: 'sports-esports',
        name: '电竞竞猜',
        image:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=85',
        tag: '',
      },
      { id: 'sports-comprehensive', name: '综合体育', image: sportsComprehensive, tag: 'NEW' },
    ],
  },
];

/** 依大厅路径解析游戏配置（用于 `/game/:slug`） */
export function findPlatformGameByHallPath(pathname: string): PlatformGameEntry | null {
  const norm = pathname.replace(/\/$/, '') || pathname;
  for (const c of platformGameCategories) {
    for (const g of c.games) {
      if (g.hallPath && g.hallPath.replace(/\/$/, '') === norm) return g;
    }
  }
  return null;
}
