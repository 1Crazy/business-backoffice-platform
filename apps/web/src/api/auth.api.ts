import { http } from "@/api/http";
import type { CurrentUser, LoginPayload, LoginResponse } from "@/types/auth";

export async function loginByPassword(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function fetchCurrentUserProfile(): Promise<CurrentUser> {
  const { data } = await http.get<CurrentUser>("/auth/profile");
  return data;
}

export async function logoutCurrentSession(): Promise<void> {
  await http.post("/auth/logout");
}
