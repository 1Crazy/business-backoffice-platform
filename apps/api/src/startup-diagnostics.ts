import { Logger } from "@nestjs/common";

export function logStartupSuccess(options: {
  logger: Logger;
  port: number;
  docsEnabled: boolean;
}): void {
  const { logger, port, docsEnabled } = options;
  logger.log(`API 已启动：http://localhost:${port}/api`);

  if (docsEnabled) {
    logger.log(`文档入口：http://localhost:${port}/docs`);
    logger.log(`调试入口：http://localhost:${port}/docs/debug`);
  }
}

export function logStartupFailure(options: {
  logger: Logger;
  error: unknown;
  databaseUrl?: string;
  port: number;
  docsEnabled: boolean;
}): void {
  const { logger, error, databaseUrl, port, docsEnabled } = options;
  logger.error("API 启动失败。");

  if (isDatabaseConnectivityError(error)) {
    const databaseTarget = formatDatabaseTarget(databaseUrl);
    logger.error(`数据库未连通，当前目标：${databaseTarget ?? "未能解析 DATABASE_URL"}`);
    logger.error("如果本地数据库运行在 Docker，请先执行：pnpm docker:infra");
    logger.error(`在数据库恢复前，API 不会监听 http://localhost:${port}。`);

    if (docsEnabled) {
      logger.error("由于 API 未成功启动，/docs、/docs/debug 与 /docs-json 当前都不可用。");
    }
  }
}

export function isDatabaseConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("connect ECONNREFUSED") ||
    error.message.includes("Connection refused")
  );
}

export function formatDatabaseTarget(databaseUrl?: string): string | null {
  if (!databaseUrl) {
    return null;
  }

  try {
    const parsed = new URL(databaseUrl);
    const databaseName = parsed.pathname.replace(/^\//, "") || "(unknown-db)";
    const port = parsed.port || defaultPortForProtocol(parsed.protocol);

    return `${parsed.hostname}:${port}/${databaseName}`;
  } catch {
    return null;
  }
}

function defaultPortForProtocol(protocol: string): string {
  if (protocol === "postgres:" || protocol === "postgresql:") {
    return "5432";
  }

  return "";
}
