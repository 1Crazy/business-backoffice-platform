import { ForbiddenException } from "@nestjs/common";

import { CsrfGuard } from "../src/common/guards/csrf.guard";

function buildContext(input: {
  method?: string;
  cookie?: string;
  authorization?: string;
  csrfHeader?: string;
  isPublic?: boolean;
}) {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        method: input.method ?? "POST",
        headers: {
          cookie: input.cookie,
          authorization: input.authorization,
          "x-csrf-token": input.csrfHeader
        }
      })
    })
  } as any;
}

describe("CsrfGuard", () => {
  it("allows safe methods without csrf token", () => {
    const guard = new CsrfGuard({
      getAllAndOverride: vi.fn().mockReturnValue(false)
    } as any);

    expect(
      guard.canActivate(
        buildContext({
          method: "GET",
          cookie: "platform_access_token=access"
        })
      )
    ).toBe(true);
  });

  it("allows bearer token requests without csrf token", () => {
    const guard = new CsrfGuard({
      getAllAndOverride: vi.fn().mockReturnValue(false)
    } as any);

    expect(
      guard.canActivate(
        buildContext({
          authorization: "Bearer token"
        })
      )
    ).toBe(true);
  });

  it("allows cookie-auth writes with matching csrf token", () => {
    const guard = new CsrfGuard({
      getAllAndOverride: vi.fn().mockReturnValue(false)
    } as any);

    expect(
      guard.canActivate(
        buildContext({
          cookie: "platform_access_token=access; platform_csrf_token=csrf-1",
          csrfHeader: "csrf-1"
        })
      )
    ).toBe(true);
  });

  it("rejects cookie-auth writes without matching csrf token", () => {
    const guard = new CsrfGuard({
      getAllAndOverride: vi.fn().mockReturnValue(false)
    } as any);

    expect(() =>
      guard.canActivate(
        buildContext({
          cookie: "platform_access_token=access; platform_csrf_token=csrf-1",
          csrfHeader: "csrf-2"
        })
      )
    ).toThrow(ForbiddenException);
  });

  it("requires csrf token on public endpoints explicitly marked as csrf protected", () => {
    const guard = new CsrfGuard({
      getAllAndOverride: vi
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
    } as any);

    expect(() =>
      guard.canActivate(
        buildContext({
          cookie: "platform_refresh_token=refresh; platform_csrf_token=csrf-1"
        })
      )
    ).toThrow(ForbiddenException);
  });
});
