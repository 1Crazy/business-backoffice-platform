/** CSRF 装饰器：用于让特定公开接口也执行 CSRF 校验，例如 cookie 刷新入口。 */
import { SetMetadata } from "@nestjs/common";

export const REQUIRE_CSRF_KEY = "requireCsrf";
export const RequireCsrf = (): MethodDecorator & ClassDecorator => SetMetadata(REQUIRE_CSRF_KEY, true);
