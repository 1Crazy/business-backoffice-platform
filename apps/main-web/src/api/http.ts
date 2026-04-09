/** HTTP 基础设施：统一请求实例、鉴权头注入与会话续期策略。 */
import axios from "axios";

import { clearStoredSession, getStoredSession, updateAccessToken } from "@/auth/session";
import type { LoginResponse } from "@/types/auth";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const http = axios.create({
  baseURL,
  timeout: 20000
});

const refreshHttp = axios.create({
  baseURL,
  timeout: 20000
});

let refreshPromise: Promise<string | null> | null = null;

http.interceptors.request.use((config) => {
  const { accessToken } = getStoredSession();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
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

    const { refreshToken } = getStoredSession();

    if (!refreshToken) {
      clearStoredSession();
      throw error;
    }

    originalRequest._retry = true;
    const nextAccessToken = await refreshAccessToken(refreshToken);

    if (!nextAccessToken) {
      clearStoredSession();
      throw error;
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

    return http(originalRequest);
  }
);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<LoginResponse>("/auth/refresh", { refreshToken })
      .then(({ data }) => {
        updateAccessToken(data.accessToken, data.sessionExpiresAt);
        return data.accessToken;
      })
      .catch(() => {
        clearStoredSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
