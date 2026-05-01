import { getToken } from '../lib/auth';

/**
 * 留空时走同域 + webpack devServer 代理（/api -> localhost:3301）。
 * 直连后端且已配置 CORS 时可在构建前设置环境变量 `API_BASE=http://host:port`（无尾斜杠）。
 */
const API_BASE = (typeof process !== 'undefined' && process.env.API_BASE
  ? String(process.env.API_BASE)
  : ''
).replace(/\/$/, '');

function parseErrorMessageFromBody(text: string, status: number): string {
  const t = text.trim();
  if (!t) {
    if (status === 502 || status === 503) {
      return '服务暂不可用（上游未响应）';
    }
    if (status === 504) {
      return '网关超时：请确认 API 已启动。开发时若未起后端，可执行 npm run dev:mock 使用本地模拟接口。';
    }
    return `请求失败（HTTP ${status}）。本地开发未启动后端时，请执行 npm run dev:mock；已启动后端时请确认 API 监听 3301 且与 webpack 代理一致。`;
  }
  if (t.startsWith('<!DOCTYPE') || t.startsWith('<html')) {
    return '接口未返回数据（可能未启动 API 或代理未生效）';
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

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

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
      throw new Error(
        '响应不是有效 JSON。请确认通过 npm run dev 打开且已配置 /api 代理，或检查 API_BASE',
      );
    }
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络与后端服务（默认本机 http://localhost:3301）');
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Failed to fetch' || msg.includes('Load failed') || msg.includes('NetworkError')) {
      throw new Error(
        '无法连接服务器。请确认后端 API 已启动，并使用 npm run dev（代理 /api）或配置网关转发 /api',
      );
    }
    throw err;
  }
}

export function apiGet<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T = unknown>(path: string, data?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}
