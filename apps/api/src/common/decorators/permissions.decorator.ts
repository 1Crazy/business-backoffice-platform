/** 共享装饰器：负责把请求上下文中的认证与权限语义收敛为可复用的参数装饰器。 */
import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);

