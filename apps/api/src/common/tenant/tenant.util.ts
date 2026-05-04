import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

import type { AuthUser } from "@/common/auth/auth-user.interface";

type TenantScopedActor = Pick<AuthUser, "tenantId">;

export function requireTenantId(actor: TenantScopedActor, message = "当前请求缺少租户上下文。"): string {
  if (!actor.tenantId) {
    throw new UnauthorizedException(message);
  }

  return actor.tenantId;
}

export function assertTenantMatch(
  actor: TenantScopedActor,
  tenantId: string | null | undefined,
  message = "当前账号无权访问其他租户数据。"
): void {
  if (!tenantId || tenantId !== requireTenantId(actor)) {
    throw new ForbiddenException(message);
  }
}

export function withTenantWhere<T extends Record<string, unknown>>(tenantId: string, where?: T): T {
  if (!where || Object.keys(where).length === 0) {
    return { tenantId } as unknown as T;
  }

  return {
    AND: [{ tenantId }, where]
  } as unknown as T;
}
