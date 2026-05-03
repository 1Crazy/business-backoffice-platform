import { HttpException } from "@nestjs/common";

import { ApiRateLimitGuard } from "../src/common/guards/api-rate-limit.guard";
import { InMemoryRiskThrottleStore, RiskThrottleService } from "../src/common/security/risk-throttle.service";

function buildContext(request: Record<string, unknown>, reflectorValues: boolean[] = [false, false]) {
  const reflector = {
    getAllAndOverride: vi.fn().mockImplementation(() => reflectorValues.shift())
  } as any;
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as any;

  return {
    reflector,
    context
  };
}

describe("ApiRateLimitGuard", () => {
  it("skips public routes because they have dedicated or anonymous controls", async () => {
    const { reflector, context } = buildContext(
      {
        method: "POST",
        originalUrl: "/api/auth/login"
      },
      [false, true]
    );
    const riskThrottleService = {
      consume: vi.fn()
    };
    const guard = new ApiRateLimitGuard(reflector, riskThrottleService as any);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(riskThrottleService.consume).not.toHaveBeenCalled();
  });

  it("uses a read bucket for authenticated list requests", async () => {
    const { reflector, context } = buildContext({
      method: "GET",
      originalUrl: "/api/customers?page=1",
      headers: {},
      socket: {},
      user: {
        id: "user-1",
        tenantId: "tenant-1"
      }
    });
    const riskThrottleService = {
      consume: vi.fn()
    };
    const guard = new ApiRateLimitGuard(reflector, riskThrottleService as any);

    await guard.canActivate(context);

    expect(riskThrottleService.consume).toHaveBeenCalledWith(
      "api-rate:tenant:tenant-1:user:user-1:read",
      expect.objectContaining({
        maxAttempts: 300
      })
    );
  });

  it("uses a stricter bucket for writes and expensive endpoints", async () => {
    const riskThrottleService = {
      consume: vi.fn()
    };
    const writeContext = buildContext({
      method: "PATCH",
      originalUrl: "/api/customers/customer-1",
      headers: {},
      socket: {},
      user: {
        id: "user-1",
        tenantId: "tenant-1"
      }
    });
    const uploadContext = buildContext({
      method: "POST",
      originalUrl: "/api/uploads",
      headers: {},
      socket: {},
      user: {
        id: "user-1",
        tenantId: "tenant-1"
      }
    });

    await new ApiRateLimitGuard(writeContext.reflector, riskThrottleService as any).canActivate(writeContext.context);
    await new ApiRateLimitGuard(uploadContext.reflector, riskThrottleService as any).canActivate(uploadContext.context);

    expect(riskThrottleService.consume).toHaveBeenNthCalledWith(
      1,
      "api-rate:tenant:tenant-1:user:user-1:write",
      expect.objectContaining({
        maxAttempts: 120
      })
    );
    expect(riskThrottleService.consume).toHaveBeenNthCalledWith(
      2,
      "api-rate:tenant:tenant-1:user:user-1:expensive",
      expect.objectContaining({
        maxAttempts: 30
      })
    );
  });

  it("throws 429 when a global API bucket is exhausted", async () => {
    const { reflector, context } = buildContext({
      method: "GET",
      originalUrl: "/api/customers",
      headers: {},
      socket: {},
      user: {
        id: "user-1",
        tenantId: "tenant-1"
      }
    });
    const service = new RiskThrottleService(new InMemoryRiskThrottleStore());
    const guard = new ApiRateLimitGuard(reflector, service);

    for (let index = 0; index < 300; index += 1) {
      await guard.canActivate(context);
    }

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(HttpException);
  });
});
