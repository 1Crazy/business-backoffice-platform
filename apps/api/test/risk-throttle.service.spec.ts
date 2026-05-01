import { HttpException } from "@nestjs/common";

import {
  InMemoryRiskThrottleStore,
  RiskThrottleService,
  type RiskThrottleOptions
} from "../src/common/security/risk-throttle.service";

const options: RiskThrottleOptions = {
  maxAttempts: 2,
  windowMs: 60_000,
  lockMs: 60_000
};

describe("RiskThrottleService", () => {
  it("shares failure state across service instances backed by the same store", async () => {
    const sharedStore = new InMemoryRiskThrottleStore();
    const firstInstance = new RiskThrottleService(sharedStore);
    const secondInstance = new RiskThrottleService(sharedStore);

    await firstInstance.recordFailure("Auth:Login:Admin", options);
    await secondInstance.recordFailure("auth:login:admin", options);

    await expect(firstInstance.assertAllowed("AUTH:LOGIN:ADMIN", options)).rejects.toBeInstanceOf(HttpException);
  });

  it("clears failure state after a successful attempt", async () => {
    const service = new RiskThrottleService(new InMemoryRiskThrottleStore());

    await service.recordFailure("open-api:key-1", options);
    await service.recordSuccess("OPEN-API:KEY-1");

    await expect(service.assertAllowed("open-api:key-1", options)).resolves.toBeUndefined();
  });

  it("resets expired windows before locking a key", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));
    const service = new RiskThrottleService(new InMemoryRiskThrottleStore());

    await service.recordFailure("auth:refresh:hash-1", options);
    jest.setSystemTime(new Date("2026-05-01T00:02:00.000Z"));
    await service.assertAllowed("auth:refresh:hash-1", options);
    await service.recordFailure("auth:refresh:hash-1", options);

    await expect(service.assertAllowed("auth:refresh:hash-1", options)).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});
