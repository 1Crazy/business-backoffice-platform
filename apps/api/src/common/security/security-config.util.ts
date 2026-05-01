/** 安全配置校验：集中处理启动期 fail-fast 规则，避免危险默认值进入运行环境。 */
import { ConfigService } from "@nestjs/config";

export const DEFAULT_INSECURE_JWT_SECRET = "replace-with-a-long-secret";
const MIN_JWT_SECRET_LENGTH = 32;

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

export function assertRuntimeSecurityConfig(configService: ConfigService): void {
  getRequiredJwtSecret(configService);
  getAllowedCorsOrigins(configService);
}
