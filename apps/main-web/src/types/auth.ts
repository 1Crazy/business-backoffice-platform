/** 领域类型定义：维护主应用统一登录态与当前用户资料契约。 */
export interface CurrentUser {
  id: string;
  tenantId: string;
  tenantCode: string;
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
  sessionExpiresAt: string;
  success?: boolean;
  user: CurrentUser;
}
