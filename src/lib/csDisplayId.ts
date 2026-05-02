import { publicDisplayId8 } from './publicDisplayId';

/** 客服自动留言 / 页头一致的 8 位展示 ID（优先接口 displayId8，否则与历史逻辑相同的派生值） */
export function csDisplayIdFromSummary(
  data?: { displayId8?: string; userId?: string | number; customerNo?: string } | null,
): string {
  const d8 = String(data?.displayId8 ?? '').trim();
  if (d8) return d8;
  const seed =
    data?.userId != null && String(data.userId).trim() !== ''
      ? String(data.userId)
      : data?.customerNo != null && String(data.customerNo).trim() !== ''
        ? String(data.customerNo)
        : '';
  if (seed) return publicDisplayId8(seed);
  return '****';
}
