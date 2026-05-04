/** 鉴权守卫：负责在 controller 入口统一执行认证与权限校验。 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AccessPolicyService } from "../access-policy/access-policy.service";
import type { AuthUser } from "../auth/auth-user.interface";
import { ACTION_PERMISSION_KEY, type ActionPermissionMetadata } from "../decorators/action-permission.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessPolicyService: AccessPolicyService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException("当前请求缺少登录身份信息。");
    }

    const hasPermission = permissions.every((permission) => user.permissions.includes(permission));

    if (!hasPermission) {
      throw new ForbiddenException("当前账号没有执行该操作的权限。");
    }

    const actionPermission = this.reflector.getAllAndOverride<ActionPermissionMetadata | undefined>(ACTION_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (actionPermission) {
      this.accessPolicyService.assertActionAllowed(
        user,
        actionPermission.resource,
        actionPermission.action,
        "当前账号没有执行该操作的权限。"
      );
    }

    return true;
  }
}
