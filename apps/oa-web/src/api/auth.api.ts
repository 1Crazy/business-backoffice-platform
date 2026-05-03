/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type {
  CurrentUser,
  LoginPayload,
  LoginResponse,
  PasswordResetResponse,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  VerifyLoginMfaPayload
} from "@/types/auth";

export async function loginByPassword(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function verifyLoginMfa(payload: VerifyLoginMfaPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/mfa/login/verify", payload);
  return data;
}

export async function requestPasswordReset(payload: RequestPasswordResetPayload): Promise<PasswordResetResponse> {
  const { data } = await http.post<PasswordResetResponse>("/auth/password-reset/request", payload);
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<PasswordResetResponse> {
  const { data } = await http.post<PasswordResetResponse>("/auth/password-reset/confirm", payload);
  return data;
}

export async function fetchCurrentUserProfile(): Promise<CurrentUser> {
  const { data } = await http.get<CurrentUser>("/auth/profile");
  return data;
}

export async function logoutCurrentSession(): Promise<void> {
  await http.post("/auth/logout");
}
