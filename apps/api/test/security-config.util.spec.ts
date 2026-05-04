import { ConfigService } from "@nestjs/config";

import {
  DEFAULT_INSECURE_JWT_SECRET,
  getAllowedCorsOrigins,
  getJwtAccessTokenTtl,
  getRiskThrottleStoreMode,
  getRequiredJwtSecret,
  getSwaggerBasicAuth,
  shouldEnableSwagger
} from "../src/common/security/security-config.util";

function config(values: Record<string, string | undefined>) {
  return {
    get: vi.fn((key: string, fallback?: string) => values[key] ?? fallback)
  } as unknown as ConfigService;
}

describe("security config", () => {
  it("rejects the template JWT secret", () => {
    expect(() => getRequiredJwtSecret(config({ JWT_SECRET: DEFAULT_INSECURE_JWT_SECRET }))).toThrow(
      "必须将 JWT_SECRET 替换为强随机密钥"
    );
  });

  it("rejects weak JWT secrets", () => {
    expect(() => getRequiredJwtSecret(config({ JWT_SECRET: "short-secret" }))).toThrow("长度至少需要 32 位");
  });

  it("parses explicit CORS origins outside local runtime", () => {
    expect(
      getAllowedCorsOrigins(
        config({
          NODE_ENV: "production",
          CORS_ALLOWED_ORIGINS: "https://app.example.test, https://admin.example.test"
        })
      )
    ).toEqual(["https://app.example.test", "https://admin.example.test"]);
  });

  it("disables swagger by default outside local runtime", () => {
    expect(shouldEnableSwagger(config({ NODE_ENV: "production" }))).toBe(false);
  });

  it("requires swagger basic auth outside local runtime when swagger is enabled", () => {
    expect(() => getSwaggerBasicAuth(config({ NODE_ENV: "production", SWAGGER_ENABLED: "true" }))).toThrow(
      "必须配置 SWAGGER_BASIC_AUTH_USERNAME 和 SWAGGER_BASIC_AUTH_PASSWORD"
    );
    expect(
      getSwaggerBasicAuth(
        config({
          NODE_ENV: "production",
          SWAGGER_ENABLED: "true",
          SWAGGER_BASIC_AUTH_USERNAME: "docs-user",
          SWAGGER_BASIC_AUTH_PASSWORD: "docs-password"
        })
      )
    ).toEqual({
      username: "docs-user",
      password: "docs-password"
    });
  });

  it("uses a short access token ttl by default", () => {
    expect(getJwtAccessTokenTtl(config({}))).toBe("30m");
  });

  it("accepts explicit minute or second access token ttl values", () => {
    expect(getJwtAccessTokenTtl(config({ JWT_ACCESS_TOKEN_TTL: "15m" }))).toBe("15m");
    expect(getJwtAccessTokenTtl(config({ JWT_ACCESS_TOKEN_TTL: "900s" }))).toBe("900s");
  });

  it("rejects access token ttl values above thirty minutes", () => {
    expect(() => getJwtAccessTokenTtl(config({ JWT_ACCESS_TOKEN_TTL: "12h" }))).toThrow("不能超过 30 分钟");
  });

  it("allows in-memory risk throttle only in local runtimes", () => {
    expect(getRiskThrottleStoreMode(config({ NODE_ENV: "test" }))).toBe("memory");
    expect(() => getRiskThrottleStoreMode(config({ NODE_ENV: "production" }))).toThrow(
      "必须使用 RISK_THROTTLE_STORE=database"
    );
  });

  it("accepts database risk throttle store in production", () => {
    expect(getRiskThrottleStoreMode(config({ NODE_ENV: "production", RISK_THROTTLE_STORE: "database" }))).toBe(
      "database"
    );
  });
});
