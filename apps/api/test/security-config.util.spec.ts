import { ConfigService } from "@nestjs/config";

import {
  DEFAULT_INSECURE_JWT_SECRET,
  getAllowedCorsOrigins,
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
});
