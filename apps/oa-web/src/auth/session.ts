/** 会话存储能力：只保留非敏感会话元数据，并清理历史浏览器可读 token。 */
const ACCESS_TOKEN_KEY = "platform-access-token";
const REFRESH_TOKEN_KEY = "platform-refresh-token";
const SESSION_EXPIRES_AT_KEY = "platform-session-expires-at";
const CSRF_TOKEN_KEY = "platform_csrf_token";

export interface StoredSession {
  sessionExpiresAt: string | null;
}

export function getStoredSession(): StoredSession {
  clearLegacyBrowserReadableTokens();

  return {
    sessionExpiresAt: window.localStorage.getItem(SESSION_EXPIRES_AT_KEY)
  };
}

export function storeSession(sessionExpiresAt?: string): void {
  clearLegacyBrowserReadableTokens();

  if (sessionExpiresAt) {
    window.localStorage.setItem(SESSION_EXPIRES_AT_KEY, sessionExpiresAt);
  } else {
    window.localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  }
}

export function updateSessionMetadata(sessionExpiresAt?: string): void {
  if (sessionExpiresAt) {
    window.localStorage.setItem(SESSION_EXPIRES_AT_KEY, sessionExpiresAt);
  }
}

export function getCsrfToken(): string | null {
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${CSRF_TOKEN_KEY}=`))
    ?.slice(CSRF_TOKEN_KEY.length + 1) ?? null;
}

export function clearStoredSession(): void {
  clearLegacyBrowserReadableTokens();
  window.localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
}

function clearLegacyBrowserReadableTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
