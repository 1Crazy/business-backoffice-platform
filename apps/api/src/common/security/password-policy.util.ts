import { BadRequestException } from "@nestjs/common";

export interface PasswordPolicyOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSymbol?: boolean;
  forbidCommonPasswords?: boolean;
}

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123123123",
  "password123",
  "admin123456",
  "admin123456!",
  "qwerty123",
  "abc123456",
  "welcome123"
]);

export function assertStrongPassword(password: string, options: PasswordPolicyOptions = {}): void {
  const policy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: true,
    forbidCommonPasswords: true,
    ...options
  };

  const normalized = password.trim();
  const failures: string[] = [];

  if (normalized.length < policy.minLength) {
    failures.push(`至少 ${policy.minLength} 位`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(normalized)) {
    failures.push("至少一个大写字母");
  }

  if (policy.requireLowercase && !/[a-z]/.test(normalized)) {
    failures.push("至少一个小写字母");
  }

  if (policy.requireNumber && !/\d/.test(normalized)) {
    failures.push("至少一个数字");
  }

  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(normalized)) {
    failures.push("至少一个符号");
  }

  if (policy.forbidCommonPasswords && COMMON_PASSWORDS.has(normalized.toLowerCase())) {
    failures.push("不能使用过于常见的弱密码");
  }

  if (failures.length > 0) {
    throw new BadRequestException(`密码复杂度不符合要求：${failures.join("，")}。`);
  }
}
