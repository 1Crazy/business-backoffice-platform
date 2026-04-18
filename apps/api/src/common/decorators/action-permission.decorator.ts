/** 动作级权限装饰器：负责声明细粒度动作编码，供统一守卫补充鉴权。 */
import { SetMetadata } from "@nestjs/common";

export const ACTION_PERMISSION_KEY = "action_permission";

export interface ActionPermissionMetadata {
  resource: string;
  action: string;
}

export const ActionPermission = (resource: string, action: string): MethodDecorator & ClassDecorator =>
  SetMetadata(ACTION_PERMISSION_KEY, {
    resource,
    action
  } satisfies ActionPermissionMetadata);
