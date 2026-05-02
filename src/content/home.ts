import { banner01, banner02, banner03, banner04, banner05 } from '../gameAssets';

/** 首页轮播（文案与素材可在本文件统一维护） */
export const homeBannerSlides = [
  {
    id: 1,
    image: banner01,
    title: '大都汇娱乐',
    subtitle: '热门彩种 · 安全便捷',
  },
  {
    id: 2,
    image: banner02,
    title: '香港六合彩',
    subtitle: '官方玩法 · 实时同步',
  },
  {
    id: 3,
    image: banner03,
    title: '极速体验',
    subtitle: '充值到账快 · 客服在线',
  },
  {
    id: 4,
    image: banner04,
    title: '代理合作',
    subtitle: '邀请有礼 · 阶梯返佣',
  },
  {
    id: 5,
    image: banner05,
    title: '理性投注',
    subtitle: '风险提示 · 未成年人禁止',
  },
] as const;

export const homeContent = {
  bannerCta: '立即体验',
  bannerDotAria: (indexOneBased: number) => `切换到第 ${indexOneBased} 张`,
  gameCategoryAriaLabel: '游戏分区',
  viewAll: '查看全部',
  marqueeAria: '平台公告',
  marqueeBadge: '公告',
} as const;
