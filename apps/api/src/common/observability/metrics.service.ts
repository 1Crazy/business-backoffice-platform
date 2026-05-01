/** 运行指标服务：维护无依赖的进程级基础指标，供健康检查和 /metrics 暴露。 */
import { Injectable } from "@nestjs/common";

interface RequestMetricInput {
  statusCode: number;
  durationMs: number;
}

@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private requestTotal = 0;
  private errorTotal = 0;
  private durationTotalMs = 0;

  recordRequest(input: RequestMetricInput): void {
    this.requestTotal += 1;
    this.durationTotalMs += input.durationMs;

    if (input.statusCode >= 500) {
      this.errorTotal += 1;
    }
  }

  getSnapshot() {
    return {
      startedAt: new Date(this.startedAt).toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      requestTotal: this.requestTotal,
      errorTotal: this.errorTotal,
      averageRequestDurationMs: this.requestTotal === 0 ? 0 : Math.round(this.durationTotalMs / this.requestTotal)
    };
  }

  renderPrometheus(): string {
    const snapshot = this.getSnapshot();

    return [
      "# HELP platform_api_uptime_seconds Process uptime in seconds.",
      "# TYPE platform_api_uptime_seconds gauge",
      `platform_api_uptime_seconds ${snapshot.uptimeSeconds}`,
      "# HELP platform_api_http_requests_total Total HTTP requests observed by the API middleware.",
      "# TYPE platform_api_http_requests_total counter",
      `platform_api_http_requests_total ${snapshot.requestTotal}`,
      "# HELP platform_api_http_errors_total Total 5xx HTTP responses observed by the API middleware.",
      "# TYPE platform_api_http_errors_total counter",
      `platform_api_http_errors_total ${snapshot.errorTotal}`,
      "# HELP platform_api_http_request_duration_average_ms Average request duration in milliseconds.",
      "# TYPE platform_api_http_request_duration_average_ms gauge",
      `platform_api_http_request_duration_average_ms ${snapshot.averageRequestDurationMs}`
    ].join("\n");
  }
}
