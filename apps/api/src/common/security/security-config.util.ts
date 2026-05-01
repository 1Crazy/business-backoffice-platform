/** 安全配置校验：集中处理启动期 fail-fast 规则，避免危险默认值进入运行环境。 */
import { ConfigService } from "@nestjs/config";

export const DEFAULT_INSECURE_JWT_SECRET = "replace-with-a-long-secret";
const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_ACCESS_TOKEN_TTL = "30m";
const MAX_ACCESS_TOKEN_TTL_SECONDS = 60 * 30;

export function isLocalRuntime(configService: ConfigService): boolean {
  const nodeEnv = configService.get<string>("NODE_ENV", "development").trim().toLowerCase();
  return ["development", "dev", "local", "test"].includes(nodeEnv);
}

export function getRequiredJwtSecret(configService: ConfigService): string {
  const jwtSecret = configService.get<string>("JWT_SECRET")?.trim();

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required.");
  }

  if (jwtSecret === DEFAULT_INSECURE_JWT_SECRET || jwtSecret.toLowerCase().includes("replace-with")) {
    throw new Error("JWT_SECRET must be replaced with a strong secret before the API starts.");
  }

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`);
  }

  return jwtSecret;
}

export function getJwtAccessTokenTtl(configService: ConfigService): string {
  const rawTtl = configService.get<string>("JWT_ACCESS_TOKEN_TTL")?.trim() || DEFAULT_ACCESS_TOKEN_TTL;
  const ttlSeconds = parseTtlSeconds(rawTtl);

  if (ttlSeconds <= 0) {
    throw new Error("JWT_ACCESS_TOKEN_TTL must be greater than 0.");
  }

  if (ttlSeconds > MAX_ACCESS_TOKEN_TTL_SECONDS) {
    throw new Error("JWT_ACCESS_TOKEN_TTL must not exceed 30 minutes.");
  }

  return rawTtl;
}

function parseTtlSeconds(value: string): number {
  const match = value.match(/^(\d+)(s|m|h)$/);

  if (!match) {
    throw new Error("JWT_ACCESS_TOKEN_TTL must use a duration like 900s, 15m, or 1h.");
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "s") {
    return amount;
  }

  if (unit === "m") {
    return amount * 60;
  }

  return amount * 60 * 60;
}

export function getAllowedCorsOrigins(configService: ConfigService): string[] | true {
  const rawOrigins = configService.get<string>("CORS_ALLOWED_ORIGINS")?.trim();

  if (!rawOrigins) {
    if (isLocalRuntime(configService)) {
      return true;
    }

    throw new Error("CORS_ALLOWED_ORIGINS is required outside local/test environments.");
  }

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function shouldEnableSwagger(configService: ConfigService): boolean {
  const rawValue = configService.get<string>("SWAGGER_ENABLED")?.trim().toLowerCase();

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  return isLocalRuntime(configService);
}

export function getRiskThrottleStoreMode(configService: ConfigService): "memory" | "database" {
  const rawMode = configService.get<string>("RISK_THROTTLE_STORE")?.trim().toLowerCase();

  if (rawMode === "database") {
    return "database";
  }

  if (rawMode === "memory" || !rawMode) {
    if (!isLocalRuntime(configService)) {
      throw new Error("RISK_THROTTLE_STORE=database is required outside local/test environments.");
    }

    return "memory";
  }

  throw new Error("RISK_THROTTLE_STORE must be either memory or database.");
}

export function assertRuntimeSecurityConfig(configService: ConfigService): void {
  getRequiredJwtSecret(configService);
  getAllowedCorsOrigins(configService);
  getRiskThrottleStoreMode(configService);
}
