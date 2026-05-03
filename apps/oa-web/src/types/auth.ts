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

export interface VerifyLoginMfaPayload {
  ticket: string;
  code: string;
}

export interface RequestPasswordResetPayload {
  identifier: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface LoginFormModel extends LoginPayload {}

export interface LoginResponse {
  success: boolean;
  mfaRequired: boolean;
  mfaEnrollmentRequired: boolean;
  mfaTicket: string | null;
  mfaChallengeType: "totp" | null;
  mfaSetupChallenge: string | null;
  mfaRecoveryCodes: string[];
  sessionExpiresAt: string | null;
  user: CurrentUser | null;
}

export interface PasswordResetResponse {
  success: boolean;
}
