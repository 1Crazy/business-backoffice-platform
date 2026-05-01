/** auth cookie 工具：统一 refresh token 的 HttpOnly Cookie 写入和响应体剥离策略。 */
import type { Response } from "express";

export const REFRESH_TOKEN_COOKIE_NAME = "platform_refresh_token";
const REFRESH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const REFRESH_COOKIE_PATH = "/api";

export function setRefreshTokenCookie(response: Response, refreshToken: string): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH
  });
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: REFRESH_COOKIE_PATH
  });
}

export function readRefreshTokenCookie(cookieHeader: string | undefined): string | undefined {
  return cookieHeader
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`))
    ?.slice(REFRESH_TOKEN_COOKIE_NAME.length + 1);
}

export function toClientLoginResponse<T extends { refreshToken: string }>(loginResponse: T): Omit<T, "refreshToken"> {
  const { refreshToken: _refreshToken, ...clientResponse } = loginResponse;

  return clientResponse;
}
