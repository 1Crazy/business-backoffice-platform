/** 共享装饰器：用于跳过全局 API 限流，保留给已经有专项限流或公开健康检查的入口。 */
import { SetMetadata } from "@nestjs/common";

export const SKIP_API_RATE_LIMIT_KEY = "skipApiRateLimit";
export const SkipApiRateLimit = (): MethodDecorator & ClassDecorator => SetMetadata(SKIP_API_RATE_LIMIT_KEY, true);
