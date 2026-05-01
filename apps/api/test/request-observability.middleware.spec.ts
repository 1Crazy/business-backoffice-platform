import { EventEmitter } from "events";

import { MetricsService } from "../src/common/observability/metrics.service";
import { RequestObservabilityMiddleware } from "../src/common/observability/request-observability.middleware";

function buildResponse() {
  const response = new EventEmitter() as any;
  response.statusCode = 200;
  response.setHeader = jest.fn();
  return response;
}

describe("RequestObservabilityMiddleware", () => {
  it("reuses valid request id and records metrics", () => {
    const metricsService = new MetricsService();
    const middleware = new RequestObservabilityMiddleware(metricsService);
    const response = buildResponse();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    middleware.use(
      {
        headers: {
          "x-request-id": "request-123456",
          "user-agent": "agent token=secret"
        },
        method: "GET",
        originalUrl: "/api/health",
        url: "/api/health",
        ip: "127.0.0.1"
      } as any,
      response,
      jest.fn()
    );
    response.emit("finish");

    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", "request-123456");
    expect(metricsService.getSnapshot().requestTotal).toBe(1);
    expect(logSpy.mock.calls[0][0]).toContain("token=[redacted]");
    logSpy.mockRestore();
  });

  it("generates a request id when the incoming value is invalid", () => {
    const middleware = new RequestObservabilityMiddleware(new MetricsService());
    const response = buildResponse();
    jest.spyOn(console, "log").mockImplementation(() => undefined);

    middleware.use(
      {
        headers: {
          "x-request-id": "bad id with spaces"
        },
        method: "GET",
        originalUrl: "/api/health",
        url: "/api/health",
        ip: "127.0.0.1"
      } as any,
      response,
      jest.fn()
    );

    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", expect.stringMatching(/[0-9a-f-]{36}/));
    jest.restoreAllMocks();
  });
});
