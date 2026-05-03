/** 根控制器：负责暴露应用级健康检查或基础路由，避免把业务能力耦合到入口层。 */
import { Controller, Get, Header } from "@nestjs/common";

import { Public } from "./common/decorators/public.decorator";
import { MetricsService } from "./common/observability/metrics.service";
import { AppHealthRepository } from "./common/observability/repositories/app-health.repository";

@Controller()
export class AppController {
  constructor(
    private readonly appHealthRepository: AppHealthRepository,
    private readonly metricsService: MetricsService
  ) {}

  @Get("health")
  @Public()
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    dependencies: {
      database: string;
      jobQueue: string;
      attachmentStorage: string;
      attachmentScan: string;
    };
    metrics: ReturnType<MetricsService["getSnapshot"]>;
  }> {
    const dependencies = {
      database: "ok",
      jobQueue: "ok",
      attachmentStorage: "ok",
      attachmentScan: "ok"
    };

    try {
      await this.appHealthRepository.pingDatabase();
    } catch {
      dependencies.database = "error";
    }

    try {
      await this.appHealthRepository.pingJobQueue();
    } catch {
      dependencies.jobQueue = "error";
    }

    try {
      await this.appHealthRepository.pingAttachmentStorage();
    } catch {
      dependencies.attachmentStorage = "error";
    }

    try {
      dependencies.attachmentScan = await this.appHealthRepository.getAttachmentScanStatus();
    } catch {
      dependencies.attachmentScan = "error";
    }

    const dependencyStates = Object.values(dependencies);
    const status = dependencyStates.every((value) => value === "ok" || value === "disabled")
      ? "ok"
      : dependencyStates.some((value) => value === "ok" || value === "disabled")
        ? "degraded"
        : "error";

    return {
      status,
      timestamp: new Date().toISOString(),
      dependencies,
      metrics: this.metricsService.getSnapshot()
    };
  }

  @Get("metrics")
  @Public()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  getMetrics(): string {
    return this.metricsService.renderPrometheus();
  }
}
