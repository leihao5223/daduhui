/**
 * 由内部 userId（或兜底种子）稳定派生 8 位展示用 ID，
 * 外观像随机数，同一账号始终不变。
 */
export function publicDisplayId8(seed: string): string {
  const s = String(seed || '0');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  const n = 10000000 + (u % 90000000);
  return String(n);
}
