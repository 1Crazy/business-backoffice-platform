/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
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
  refreshToken: string;
  sessionExpiresAt: string;
  success?: boolean;
  user: CurrentUser;
}
