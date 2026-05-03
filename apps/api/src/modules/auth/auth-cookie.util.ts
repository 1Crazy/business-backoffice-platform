/** auth cookie 工具：统一认证 Cookie 写入、读取、清理和响应体剥离策略。 */
import { randomBytes } from "crypto";

import type { Response } from "express";

export const ACCESS_TOKEN_COOKIE_NAME = "platform_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "platform_refresh_token";
export const CSRF_TOKEN_COOKIE_NAME = "platform_csrf_token";
const ACCESS_COOKIE_MAX_AGE_MS = 1000 * 60 * 30;
const REFRESH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const AUTH_COOKIE_PATH = "/api";
const CSRF_COOKIE_PATH = "/";

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
  setAccessTokenCookie(response, accessToken);
  setRefreshTokenCookie(response, refreshToken);
  setCsrfTokenCookie(response);
}

export function setAccessTokenCookie(response: Response, accessToken: string): void {
  response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    path: AUTH_COOKIE_PATH
  });
}

export function setRefreshTokenCookie(response: Response, refreshToken: string): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: AUTH_COOKIE_PATH
  });
}

export function setCsrfTokenCookie(response: Response, csrfToken = generateCsrfToken()): void {
  response.cookie(CSRF_TOKEN_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: CSRF_COOKIE_PATH
  });
}

export function clearAuthCookies(response: Response): void {
  clearCookie(response, ACCESS_TOKEN_COOKIE_NAME, AUTH_COOKIE_PATH, true);
  clearCookie(response, REFRESH_TOKEN_COOKIE_NAME, AUTH_COOKIE_PATH, true);
  clearCookie(response, CSRF_TOKEN_COOKIE_NAME, CSRF_COOKIE_PATH, false);
}

function clearCookie(response: Response, name: string, path: string, httpOnly: boolean): void {
  response.clearCookie(name, {
    httpOnly,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path
  });
}

export function readAccessTokenCookie(cookieHeader: string | undefined): string | undefined {
  return readCookie(cookieHeader, ACCESS_TOKEN_COOKIE_NAME);
}

export function readRefreshTokenCookie(cookieHeader: string | undefined): string | undefined {
  return readCookie(cookieHeader, REFRESH_TOKEN_COOKIE_NAME);
}

export function readCsrfTokenCookie(cookieHeader: string | undefined): string | undefined {
  return readCookie(cookieHeader, CSRF_TOKEN_COOKIE_NAME);
}

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  const value = cookieHeader
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);

  return value ? decodeURIComponent(value) : undefined;
}

export function toClientLoginResponse<T extends { accessToken: string | null; refreshToken: string | null }>(
  loginResponse: T
): Omit<T, "accessToken" | "refreshToken"> {
  const { accessToken: _accessToken, refreshToken: _refreshToken, ...clientResponse } = loginResponse;

  return clientResponse;
}

function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}
