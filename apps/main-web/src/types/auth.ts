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

export interface MfaStatus {
  enabled: boolean;
  pending: boolean;
  configuredAt: string | null;
}

export interface ConfigureMfaPayload {
  code?: string;
  recoveryCode?: string;
  action?: "setup" | "rotate-recovery" | "disable";
}

export interface MfaSetupResponse {
  enabled: boolean;
  pending: boolean;
  challenge: string | null;
  recoveryCodes: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface VerifyLoginMfaPayload {
  ticket: string;
  code: string;
}

export interface VerifyMfaPayload {
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
