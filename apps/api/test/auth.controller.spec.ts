import { AuthController } from "../src/modules/auth/auth.controller";

describe("AuthController", () => {
  it("delegates login to auth service", async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        sessionExpiresAt: "2026-05-01T00:00:00.000Z"
      })
    } as any;
    const controller = new AuthController(authService);
    const response = {
      cookie: jest.fn()
    } as any;

    const payload = {
      username: "admin",
      password: "Admin123456!"
    };

    await controller.login(payload, response);

    expect(authService.login).toHaveBeenCalledWith(payload);
    expect(response.cookie).toHaveBeenCalledWith(
      "platform_refresh_token",
      "refresh",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/auth"
      })
    );
  });

  it("uses refresh token from cookie when request body omits it", async () => {
    const authService = {
      refresh: jest.fn().mockResolvedValue({
        accessToken: "token",
        refreshToken: "cookie-refresh",
        sessionExpiresAt: "2026-05-01T00:00:00.000Z"
      })
    } as any;
    const controller = new AuthController(authService);
    const request = {
      headers: {
        cookie: "other=value; platform_refresh_token=cookie-refresh"
      }
    } as any;
    const response = {
      cookie: jest.fn()
    } as any;

    await controller.refresh({}, request, response);

    expect(authService.refresh).toHaveBeenCalledWith({ refreshToken: "cookie-refresh" });
    expect(response.cookie).toHaveBeenCalledWith("platform_refresh_token", "cookie-refresh", expect.any(Object));
  });

  it("clears refresh token cookie during logout", async () => {
    const authService = {
      logout: jest.fn().mockResolvedValue({ success: true })
    } as any;
    const controller = new AuthController(authService);
    const response = {
      clearCookie: jest.fn()
    } as any;
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    await controller.logout(user, response);

    expect(authService.logout).toHaveBeenCalledWith(user);
    expect(response.clearCookie).toHaveBeenCalledWith(
      "platform_refresh_token",
      expect.objectContaining({
        path: "/api/auth"
      })
    );
  });

  it("delegates profile lookup to auth service", async () => {
    const authService = {
      getProfile: jest.fn().mockResolvedValue({
        id: "user-1"
      })
    } as any;
    const controller = new AuthController(authService);
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    await controller.getProfile(user);

    expect(authService.getProfile).toHaveBeenCalledWith("user-1", "session-1");
  });
});
