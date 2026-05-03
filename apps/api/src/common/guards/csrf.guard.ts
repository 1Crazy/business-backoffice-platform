/** CSRF 守卫：只保护依赖浏览器 Cookie 会话的非幂等请求，避免误拦截显式 Bearer/Open API 调用。 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { readAccessTokenCookie, readCsrfTokenCookie } from "@/modules/auth/auth-cookie.util";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { REQUIRE_CSRF_KEY } from "../decorators/require-csrf.decorator";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_HEADER = "x-csrf-token";

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const requiresCsrf = this.reflector.getAllAndOverride<boolean>(REQUIRE_CSRF_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic && !requiresCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const hasBearerToken = typeof request.headers.authorization === "string" && request.headers.authorization.startsWith("Bearer ");
    const accessCookie = readAccessTokenCookie(request.headers.cookie);
    const csrfCookie = readCsrfTokenCookie(request.headers.cookie);
    const csrfHeader = this.readHeader(request.headers[CSRF_HEADER]);

    if (hasBearerToken || (!accessCookie && !requiresCsrf)) {
      return true;
    }

    if (csrfCookie && csrfHeader && csrfCookie === csrfHeader) {
      return true;
    }

    throw new ForbiddenException("CSRF token is invalid.");
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
