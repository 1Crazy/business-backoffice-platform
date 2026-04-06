/** 共享装饰器：负责把请求上下文中的认证与权限语义收敛为可复用的参数装饰器。 */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { AuthUser } from "../auth/auth-user.interface";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  }
);

