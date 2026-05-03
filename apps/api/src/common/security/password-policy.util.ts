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
    failures.push(`at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(normalized)) {
    failures.push("an uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(normalized)) {
    failures.push("a lowercase letter");
  }

  if (policy.requireNumber && !/\d/.test(normalized)) {
    failures.push("a number");
  }

  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(normalized)) {
    failures.push("a symbol");
  }

  if (policy.forbidCommonPasswords && COMMON_PASSWORDS.has(normalized.toLowerCase())) {
    failures.push("a less predictable password");
  }

  if (failures.length > 0) {
    throw new BadRequestException(`Password does not meet the complexity policy: ${failures.join(", ")}.`);
  }
}
