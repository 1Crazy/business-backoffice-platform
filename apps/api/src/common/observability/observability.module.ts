/** 可观测性模块：集中导出请求指标和请求观测中间件。 */
import { Global, Module } from "@nestjs/common";

import { MetricsService } from "./metrics.service";
import { RequestObservabilityMiddleware } from "./request-observability.middleware";
import { AppHealthRepository } from "./repositories/app-health.repository";

@Global()
@Module({
  providers: [MetricsService, RequestObservabilityMiddleware, AppHealthRepository],
  exports: [MetricsService, RequestObservabilityMiddleware, AppHealthRepository]
})
export class ObservabilityModule {}
