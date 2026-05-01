/** 与星彩参考项目一致，便于同一后端签发 Token 时在两端共用登录态 */
const TOKEN_KEY = 'xingcai_token_v2';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function logout(): void {
  clearToken();
  window.dispatchEvent(new CustomEvent('user-logout'));
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
