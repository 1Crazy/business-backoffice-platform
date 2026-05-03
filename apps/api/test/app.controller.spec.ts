import { AppController } from "../src/app.controller";
import { MetricsService } from "../src/common/observability/metrics.service";

describe("AppController", () => {
  it("returns dependency status and metrics in health response", async () => {
    const metricsService = new MetricsService();
    const appHealthRepository = {
      pingDatabase: vi.fn().mockResolvedValue(undefined),
      pingJobQueue: vi.fn().mockResolvedValue(undefined),
      pingAttachmentStorage: vi.fn().mockResolvedValue(undefined),
      getAttachmentScanStatus: vi.fn().mockResolvedValue("ok")
    } as any;
    const controller = new AppController(appHealthRepository, metricsService);

    const result = await controller.getHealth();

    expect(result.status).toBe("ok");
    expect(result.dependencies.database).toBe("ok");
    expect(result.dependencies.jobQueue).toBe("ok");
    expect(result.dependencies.attachmentStorage).toBe("ok");
    expect(result.dependencies.attachmentScan).toBe("ok");
    expect(result.metrics).toEqual(expect.objectContaining({ requestTotal: 0 }));
  });

  it("marks health as degraded when database check fails", async () => {
    const controller = new AppController(
      {
        pingDatabase: vi.fn().mockRejectedValue(new Error("db down")),
        pingJobQueue: vi.fn().mockResolvedValue(undefined),
        pingAttachmentStorage: vi.fn().mockRejectedValue(new Error("storage down")),
        getAttachmentScanStatus: vi.fn().mockResolvedValue("disabled")
      } as any,
      new MetricsService()
    );

    await expect(controller.getHealth()).resolves.toEqual(
      expect.objectContaining({
        status: "degraded",
        dependencies: {
          database: "error",
          jobQueue: "ok",
          attachmentStorage: "error",
          attachmentScan: "disabled"
        }
      })
    );
  });

  it("renders prometheus metrics", () => {
    const metricsService = new MetricsService();
    metricsService.recordRequest({ statusCode: 500, durationMs: 30 });
    const controller = new AppController({ pingDatabase: vi.fn() } as any, metricsService);

    expect(controller.getMetrics()).toContain("platform_api_http_requests_total 1");
    expect(controller.getMetrics()).toContain("platform_api_http_errors_total 1");
  });
});
