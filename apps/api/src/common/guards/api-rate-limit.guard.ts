/** 全局 API 限流守卫：为普通业务接口提供租户、用户与 IP 维度的基础频控。 */
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_API_RATE_LIMIT_KEY } from "../decorators/skip-api-rate-limit.decorator";
import { RiskThrottleService, type RiskThrottleOptions } from "../security/risk-throttle.service";

const DEFAULT_API_RATE_LIMIT: RiskThrottleOptions = {
  maxAttempts: 300,
  windowMs: 60_000,
  lockMs: 60_000
};
const WRITE_API_RATE_LIMIT: RiskThrottleOptions = {
  maxAttempts: 120,
  windowMs: 60_000,
  lockMs: 60_000
};
const EXPENSIVE_API_RATE_LIMIT: RiskThrottleOptions = {
  maxAttempts: 30,
  windowMs: 60_000,
  lockMs: 60_000
};

const EXPENSIVE_PATH_PATTERN = /\/(uploads|batch-tasks|export|download|preview)(\/|$)/i;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly riskThrottleService: RiskThrottleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(SKIP_API_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (skipRateLimit) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const key = this.buildThrottleKey(request);
    const options = this.resolveOptions(request);

    await this.riskThrottleService.consume(key, options);

    return true;
  }

  private buildThrottleKey(request: Request & { user?: AuthUser }): string {
    const user = request.user;
    const tenantPart = user?.tenantId ? `tenant:${user.tenantId}` : "tenant:anonymous";
    const actorPart = user?.id ? `user:${user.id}` : `ip:${this.resolveClientIp(request)}`;
    const routePart = this.resolveRouteBucket(request);

    return `api-rate:${tenantPart}:${actorPart}:${routePart}`;
  }

  private resolveRouteBucket(request: Request): string {
    const path = this.normalizePath(request.originalUrl ?? request.url);

    if (EXPENSIVE_PATH_PATTERN.test(path)) {
      return "expensive";
    }

    return SAFE_METHODS.has(request.method.toUpperCase()) ? "read" : "write";
  }

  private resolveOptions(request: Request): RiskThrottleOptions {
    const path = this.normalizePath(request.originalUrl ?? request.url);

    if (EXPENSIVE_PATH_PATTERN.test(path)) {
      return EXPENSIVE_API_RATE_LIMIT;
    }

    return SAFE_METHODS.has(request.method.toUpperCase()) ? DEFAULT_API_RATE_LIMIT : WRITE_API_RATE_LIMIT;
  }

  private normalizePath(path: string): string {
    return path.split("?")[0] ?? path;
  }

  private resolveClientIp(request: Request): string {
    const forwardedFor = request.headers["x-forwarded-for"];
    const rawValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const forwardedIp = rawValue?.split(",")[0]?.trim();

    return forwardedIp || request.ip || request.socket.remoteAddress || "unknown";
  }
}
