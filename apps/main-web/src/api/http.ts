/** HTTP 基础设施：统一请求实例、鉴权头注入与会话续期策略。 */
import axios from "axios";

import { clearStoredSession, getCsrfToken, updateSessionMetadata } from "@/auth/session";
import type { LoginResponse } from "@/types/auth";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const http = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true
});

const refreshHttp = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true
});

let refreshPromise: Promise<boolean> | null = null;

http.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();

  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url as string | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      throw error;
    }

    if (requestUrl?.includes("/auth/login") || requestUrl?.includes("/auth/refresh")) {
      throw error;
    }

    originalRequest._retry = true;
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      clearStoredSession();
      throw error;
    }

    return http(originalRequest);
  }
);

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<LoginResponse>("/auth/refresh")
      .then(({ data }) => {
        updateSessionMetadata(data.sessionExpiresAt ?? undefined);
        return true;
      })
      .catch(() => {
        clearStoredSession();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
