import { AppController } from "../src/app.controller";
import { MetricsService } from "../src/common/observability/metrics.service";

describe("AppController", () => {
  it("returns dependency status and metrics in health response", async () => {
    const metricsService = new MetricsService();
    const appHealthRepository = {
      pingDatabase: jest.fn().mockResolvedValue(undefined)
    } as any;
    const controller = new AppController(appHealthRepository, metricsService);

    const result = await controller.getHealth();

    expect(result.status).toBe("ok");
    expect(result.dependencies.database).toBe("ok");
    expect(result.metrics).toEqual(expect.objectContaining({ requestTotal: 0 }));
  });

  it("marks health as degraded when database check fails", async () => {
    const controller = new AppController(
      {
        pingDatabase: jest.fn().mockRejectedValue(new Error("db down"))
      } as any,
      new MetricsService()
    );

    await expect(controller.getHealth()).resolves.toEqual(
      expect.objectContaining({
        status: "degraded",
        dependencies: {
          database: "error"
        }
      })
    );
  });

  it("renders prometheus metrics", () => {
    const metricsService = new MetricsService();
    metricsService.recordRequest({ statusCode: 500, durationMs: 30 });
    const controller = new AppController({ pingDatabase: jest.fn() } as any, metricsService);

    expect(controller.getMetrics()).toContain("platform_api_http_requests_total 1");
    expect(controller.getMetrics()).toContain("platform_api_http_errors_total 1");
  });
});
