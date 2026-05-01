/** 会话存储能力：复用平台级 token key，保证主应用与子应用共享统一登录态。 */
const ACCESS_TOKEN_KEY = "platform-access-token";
const REFRESH_TOKEN_KEY = "platform-refresh-token";
const SESSION_EXPIRES_AT_KEY = "platform-session-expires-at";

export interface StoredSession {
  accessToken: string | null;
  sessionExpiresAt: string | null;
}

export function getStoredSession(): StoredSession {
  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
    sessionExpiresAt: window.localStorage.getItem(SESSION_EXPIRES_AT_KEY)
  };
}

export function storeSession(accessToken: string, sessionExpiresAt?: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  // refresh token 只允许存在于 HttpOnly cookie；这里清理历史版本遗留的浏览器可读 token。
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);

  if (sessionExpiresAt) {
    window.localStorage.setItem(SESSION_EXPIRES_AT_KEY, sessionExpiresAt);
  } else {
    window.localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  }
}

export function updateAccessToken(accessToken: string, sessionExpiresAt?: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (sessionExpiresAt) {
    window.localStorage.setItem(SESSION_EXPIRES_AT_KEY, sessionExpiresAt);
  }
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
}
