import { ForbiddenException } from "@nestjs/common";
import { PermissionsGuard } from "../src/common/guards/permissions.guard";

describe("PermissionsGuard", () => {
  it("allows access when all permissions are present", () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["customer:read"])
    } as any;

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["customer:read", "dashboard:view"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(
      reflector,
      {
        assertActionAllowed: vi.fn()
      } as any
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows platform governance permissions to pass through the same guard", () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["department:read"])
    } as any;

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["department:read", "dashboard:view"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(
      reflector,
      {
        assertActionAllowed: vi.fn()
      } as any
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects access when permissions are missing", () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["customer:assign"])
    } as any;

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["customer:read"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(
      reflector,
      {
        assertActionAllowed: vi.fn()
      } as any
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("applies action-level restrictions after the coarse permission check", () => {
    const assertActionAllowed = vi.fn().mockImplementation(() => {
      throw new ForbiddenException("denied by policy");
    });
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["customer:assign"])
        .mockReturnValueOnce({
          resource: "customer",
          action: "assign"
        })
    } as any;

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["customer:assign"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(
      reflector,
      {
        assertActionAllowed
      } as any
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(assertActionAllowed).toHaveBeenCalledWith(
      { permissions: ["customer:assign"] },
      "customer",
      "assign",
      "You do not have permission to perform this action."
    );
  });
});
