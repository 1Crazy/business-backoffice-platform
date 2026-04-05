export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  departmentId?: string | null;
  roleCodes: string[];
  permissions: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginFormModel extends LoginPayload {}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt: string;
  success?: boolean;
  user: CurrentUser;
}
