/** 请求观测中间件：生成请求 ID、写回响应头、记录结构化访问日志并累计基础指标。 */
import { randomUUID } from "crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

import { MetricsService } from "./metrics.service";

const REQUEST_ID_HEADER = "x-request-id";
const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

@Injectable()
export class RequestObservabilityMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const requestId = this.resolveRequestId(request.headers[REQUEST_ID_HEADER]);

    response.setHeader("X-Request-Id", requestId);

    response.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      this.metricsService.recordRequest({
        statusCode: response.statusCode,
        durationMs
      });

      const logPayload = {
        timestamp: new Date().toISOString(),
        level: response.statusCode >= 500 ? "error" : "info",
        requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        status: response.statusCode,
        durationMs,
        userAgent: this.redactHeader(request.headers["user-agent"]),
        remoteAddress: request.ip
      };

      const line = JSON.stringify(logPayload);

      if (response.statusCode >= 500) {
        console.error(line);
      } else {
        console.log(line);
      }
    });

    next();
  }

  private resolveRequestId(value: string | string[] | undefined): string {
    const candidate = Array.isArray(value) ? value[0] : value;

    if (candidate && SAFE_REQUEST_ID_PATTERN.test(candidate)) {
      return candidate;
    }

    return randomUUID();
  }

  private redactHeader(value: string | string[] | undefined): string | undefined {
    const rawValue = Array.isArray(value) ? value.join(",") : value;

    if (!rawValue) {
      return undefined;
    }

    return rawValue.replace(/(password|token|secret|cookie)=([^;\s]+)/gi, "$1=[redacted]");
  }
}
