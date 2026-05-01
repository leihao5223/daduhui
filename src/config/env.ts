/**
 * 生产构建通过 webpack `DefinePlugin` 注入 `process.env.API_BASE`（无尾斜杠）。
 * 空字符串：请求与站点同源的 `/api/*`（需 Nginx 等将 `/api` 反代到 Node）。
 * 非空：直连独立 API 域名（需服务端已放开 CORS）。
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const w = (window as unknown as { __PANGXIE_API_BASE__?: string }).__PANGXIE_API_BASE__;
    if (typeof w === 'string' && w.trim()) {
      return w.trim().replace(/\/$/, '');
    }
  }
  if (typeof process !== 'undefined' && process.env.API_BASE) {
    return String(process.env.API_BASE).replace(/\/$/, '');
  }
  return '';
}

export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
