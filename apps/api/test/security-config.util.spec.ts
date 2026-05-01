import { ConfigService } from "@nestjs/config";

import {
  DEFAULT_INSECURE_JWT_SECRET,
  getAllowedCorsOrigins,
  getJwtAccessTokenTtl,
  getRiskThrottleStoreMode,
  getRequiredJwtSecret,
  shouldEnableSwagger
} from "../src/common/security/security-config.util";

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback)
  } as unknown as ConfigService;
}

describe("security config", () => {
  it("rejects the template JWT secret", () => {
    expect(() => getRequiredJwtSecret(config({ JWT_SECRET: DEFAULT_INSECURE_JWT_SECRET }))).toThrow(
      "JWT_SECRET must be replaced"
    );
  });

  it("rejects weak JWT secrets", () => {
    expect(() => getRequiredJwtSecret(config({ JWT_SECRET: "short-secret" }))).toThrow("at least 32 characters");
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

  it("uses a short access token ttl by default", () => {
    expect(getJwtAccessTokenTtl(config({}))).toBe("30m");
  });

  it("accepts explicit minute or second access token ttl values", () => {
    expect(getJwtAccessTokenTtl(config({ JWT_ACCESS_TOKEN_TTL: "15m" }))).toBe("15m");
    expect(getJwtAccessTokenTtl(config({ JWT_ACCESS_TOKEN_TTL: "900s" }))).toBe("900s");
  });

  it("rejects access token ttl values above thirty minutes", () => {
    expect(() => getJwtAccessTokenTtl(config({ JWT_ACCESS_TOKEN_TTL: "12h" }))).toThrow("must not exceed 30 minutes");
  });

  it("allows in-memory risk throttle only in local runtimes", () => {
    expect(getRiskThrottleStoreMode(config({ NODE_ENV: "test" }))).toBe("memory");
    expect(() => getRiskThrottleStoreMode(config({ NODE_ENV: "production" }))).toThrow(
      "RISK_THROTTLE_STORE=database is required"
    );
  });

  it("accepts database risk throttle store in production", () => {
    expect(getRiskThrottleStoreMode(config({ NODE_ENV: "production", RISK_THROTTLE_STORE: "database" }))).toBe(
      "database"
    );
  });
});
