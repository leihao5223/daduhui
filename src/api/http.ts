import { getToken } from '../lib/auth';
import { buildApiUrl } from '../config/env';

export { buildApiUrl } from '../config/env';

/**
 * 玩家接口：路径会经 `buildApiUrl` 拼接 `API_BASE`（构建时注入），与管理员 `adminFetch` 同源策略一致。
 */
function parseErrorMessageFromBody(text: string, status: number): string {
  const t = text.trim();
  if (!t) {
    if (status === 502 || status === 503) {
      return '服务暂不可用（上游未响应）';
    }
    if (status === 504) {
      return '网关超时：请确认 API 已启动。本地可执行 npm run dev:mock 使用模拟接口。';
    }
    return `请求失败（HTTP ${status}）。请确认已配置 API 地址（API_BASE 或同源 /api 反代）且服务可用。`;
  }
  if (t.startsWith('<!DOCTYPE') || t.startsWith('<html')) {
    return '接口未返回数据（可能将 /api 指到了静态页，请检查部署与反向代理）';
  }
  try {
    const j = JSON.parse(t) as { message?: string; error?: string; msg?: string; detail?: string };
    return (
      (typeof j.message === 'string' && j.message) ||
      (typeof j.error === 'string' && j.error) ||
      (typeof j.msg === 'string' && j.msg) ||
      (typeof j.detail === 'string' && j.detail) ||
      t.slice(0, 200)
    );
  } catch {
    return t.length > 200 ? `${t.slice(0, 200)}…` : t;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { timeout = 15000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const url = buildApiUrl(path);

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await response.text();

    if (!response.ok) {
      throw new Error(parseErrorMessageFromBody(text, response.status) || '请求失败');
    }

    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      const trimmed = text.trim();
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
        throw new Error(
          '接口返回了网页而不是 JSON（常见原因：只在 Vercel 部署了前端，/api 被静态站重写）。请在 Vercel 项目 Environment Variables 里设置 API_BASE 为公网上可直接访问的 Node 根地址（无尾斜杠，例如 https://api.你的域名），保存后重新 Deploy；或在本页上方把 window.__PANGXIE_API_BASE__ 改成同一地址后再构建。Node 后端需单独运行 pangxie/server。',
        );
      }
      throw new Error('响应不是有效 JSON。请确认 API_BASE 或 /api 代理指向后端。');
    }
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络与 API 服务。');
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Failed to fetch' || msg.includes('Load failed') || msg.includes('NetworkError')) {
      throw new Error('无法连接服务器。请确认 API 可访问并已配置 CORS / 同源反代。');
    }
    throw err;
  }
}

export function apiGet<T = unknown>(path: string, init: RequestInit & { timeout?: number } = {}): Promise<T> {
  const { timeout, ...rest } = init;
  return apiFetch<T>(path, { method: 'GET', ...(timeout != null ? { timeout } : {}), ...rest });
}

export function apiPost<T = unknown>(path: string, data?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}
