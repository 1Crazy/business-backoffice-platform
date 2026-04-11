import { ForbiddenException } from "@nestjs/common";
import { PermissionsGuard } from "../src/common/guards/permissions.guard";

describe("PermissionsGuard", () => {
  it("allows access when all permissions are present", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["customer:read"])
    } as any;

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["customer:read", "dashboard:view"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows platform governance permissions to pass through the same guard", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["department:read"])
    } as any;

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["department:read", "dashboard:view"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects access when permissions are missing", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["customer:assign"])
    } as any;

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: ["customer:read"]
          }
        })
      })
    } as any;

    const guard = new PermissionsGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
