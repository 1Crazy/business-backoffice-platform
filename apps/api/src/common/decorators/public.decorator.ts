/** 共享装饰器：负责把请求上下文中的认证与权限语义收敛为可复用的参数装饰器。 */
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

