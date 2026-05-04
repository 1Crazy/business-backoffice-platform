import { Logger } from "@nestjs/common";

import {
  formatDatabaseTarget,
  isDatabaseConnectivityError,
  logStartupFailure
} from "../src/startup-diagnostics";

describe("startup diagnostics", () => {
  it("detects prisma database connectivity errors", () => {
    const error = new Error("Can't reach database server at `localhost:5433`");
    error.name = "PrismaClientInitializationError";

    expect(isDatabaseConnectivityError(error)).toBe(true);
    expect(isDatabaseConnectivityError(new Error("other failure"))).toBe(false);
  });

  it("formats database target from database url", () => {
    expect(formatDatabaseTarget("postgresql://scrm:scrm@localhost:5433/scrm?schema=public")).toBe("localhost:5433/scrm");
    expect(formatDatabaseTarget(undefined)).toBeNull();
  });

  it("prints actionable startup hints when database is unavailable", () => {
    const logger = {
      error: vi.fn(),
      log: vi.fn()
    } as unknown as Logger;
    const error = new Error("Can't reach database server at `localhost:5433`");
    error.name = "PrismaClientInitializationError";

    logStartupFailure({
      logger,
      error,
      databaseUrl: "postgresql://scrm:scrm@localhost:5433/scrm?schema=public",
      port: 3000,
      docsEnabled: true
    });

    expect((logger.error as any).mock.calls.flat().join("\n")).toContain("数据库未连通");
    expect((logger.error as any).mock.calls.flat().join("\n")).toContain("/docs、/docs/debug 与 /docs-json 当前都不可用");
    expect((logger.error as any).mock.calls.flat().join("\n")).toContain("pnpm docker:infra");
  });
});
