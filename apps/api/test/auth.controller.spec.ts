import { AuthController } from "../src/modules/auth/auth.controller";

describe("AuthController", () => {
  it("delegates login to auth service", async () => {
    const authService = {
      login: vi.fn().mockResolvedValue({
        success: true,
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        mfaTicket: null,
        mfaChallengeType: null,
        mfaSetupChallenge: null,
        mfaRecoveryCodes: [],
        accessToken: "token",
        refreshToken: "refresh",
        sessionExpiresAt: "2026-05-01T00:00:00.000Z",
        user: null
      })
    } as any;
    const controller = new AuthController(authService);
    const response = {
      cookie: vi.fn()
    } as any;

    const payload = {
      username: "admin",
      password: "Admin123456!Aa"
    };

    const result = await controller.login(payload, response);

    expect(authService.login).toHaveBeenCalledWith(payload);
    expect(result).toEqual({
      success: true,
      mfaRequired: false,
      mfaEnrollmentRequired: false,
      mfaTicket: null,
      mfaChallengeType: null,
      mfaSetupChallenge: null,
      mfaRecoveryCodes: [],
      user: null,
      sessionExpiresAt: "2026-05-01T00:00:00.000Z"
    });
    expect(response.cookie).toHaveBeenCalledWith(
      "platform_access_token",
      "token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api"
      })
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "platform_refresh_token",
      "refresh",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api"
      })
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "platform_csrf_token",
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: "lax",
        path: "/"
      })
    );
  });

  it("clears cookies and returns an mfa challenge when login requires second factor", async () => {
    const authService = {
      login: vi.fn().mockResolvedValue({
        success: false,
        mfaRequired: true,
        mfaEnrollmentRequired: true,
        mfaTicket: "ticket-1",
        mfaChallengeType: "totp",
        mfaSetupChallenge: "otpauth://totp/test",
        mfaRecoveryCodes: [],
        accessToken: null,
        refreshToken: null,
        sessionExpiresAt: null,
        user: null
      })
    } as any;
    const controller = new AuthController(authService);
    const response = {
      cookie: vi.fn(),
      clearCookie: vi.fn()
    } as any;

    const result = await controller.login({ username: "admin", password: "Admin123456!Aa" }, response);

    expect(result).toMatchObject({
      success: false,
      mfaRequired: true,
      mfaEnrollmentRequired: true,
      mfaTicket: "ticket-1",
      mfaSetupChallenge: "otpauth://totp/test"
    });
    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.clearCookie).toHaveBeenCalledTimes(3);
  });

  it("uses refresh token from cookie when request body omits it", async () => {
    const authService = {
      refresh: vi.fn().mockResolvedValue({
        success: true,
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        mfaTicket: null,
        mfaChallengeType: null,
        mfaSetupChallenge: null,
        mfaRecoveryCodes: [],
        accessToken: "token",
        refreshToken: "cookie-refresh",
        sessionExpiresAt: "2026-05-01T00:00:00.000Z",
        user: null
      })
    } as any;
    const controller = new AuthController(authService);
    const request = {
      headers: {
        cookie: "other=value; platform_refresh_token=cookie-refresh"
      }
    } as any;
    const response = {
      cookie: vi.fn()
    } as any;

    await controller.refresh({}, request, response);

    expect(authService.refresh).toHaveBeenCalledWith({ refreshToken: "cookie-refresh" });
    expect(response.cookie).toHaveBeenCalledWith("platform_access_token", "token", expect.any(Object));
    expect(response.cookie).toHaveBeenCalledWith("platform_refresh_token", "cookie-refresh", expect.any(Object));
  });

  it("ignores refresh token from request body", async () => {
    const authService = {
      refresh: vi.fn().mockResolvedValue({
        success: true,
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        mfaTicket: null,
        mfaChallengeType: null,
        mfaSetupChallenge: null,
        mfaRecoveryCodes: [],
        accessToken: "token",
        refreshToken: "cookie-refresh-next",
        sessionExpiresAt: "2026-05-01T00:00:00.000Z",
        user: null
      })
    } as any;
    const controller = new AuthController(authService);
    const request = {
      headers: {
        cookie: ""
      }
    } as any;
    const response = {
      cookie: vi.fn()
    } as any;

    await controller.refresh({ refreshToken: "body-refresh" }, request, response);

    expect(authService.refresh).toHaveBeenCalledWith({ refreshToken: undefined });
  });

  it("clears refresh token cookie during logout", async () => {
    const authService = {
      logout: vi.fn().mockResolvedValue({ success: true })
    } as any;
    const controller = new AuthController(authService);
    const response = {
      clearCookie: vi.fn()
    } as any;
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    await controller.logout(user, response);

    expect(authService.logout).toHaveBeenCalledWith(user);
    expect(response.clearCookie).toHaveBeenCalledWith(
      "platform_access_token",
      expect.objectContaining({
        path: "/api"
      })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      "platform_refresh_token",
      expect.objectContaining({
        path: "/api"
      })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      "platform_csrf_token",
      expect.objectContaining({
        path: "/"
      })
    );
  });

  it("delegates profile lookup to auth service", async () => {
    const authService = {
      getProfile: vi.fn().mockResolvedValue({
        id: "user-1"
      }),
      getMfaStatus: vi.fn().mockResolvedValue({
        enabled: true,
        pending: false,
        configuredAt: "2026-05-04T00:00:00.000Z"
      })
    } as any;
    const controller = new AuthController(authService);
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    await controller.getProfile(user);
    await controller.getMfaStatus(user);

    expect(authService.getProfile).toHaveBeenCalledWith("user-1", "session-1");
    expect(authService.getMfaStatus).toHaveBeenCalledWith(user);
  });

  it("delegates current-user session listing to auth service", async () => {
    const authService = {
      listMySessions: vi.fn().mockResolvedValue([
        {
          id: "session-1",
          isCurrent: true
        }
      ])
    } as any;
    const controller = new AuthController(authService);
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    const result = await controller.listMySessions(user);

    expect(authService.listMySessions).toHaveBeenCalledWith(user);
    expect(result).toEqual([
      {
        id: "session-1",
        isCurrent: true
      }
    ]);
  });

  it("delegates current-user session revocation to auth service", async () => {
    const authService = {
      revokeMySession: vi.fn().mockResolvedValue({ success: true })
    } as any;
    const controller = new AuthController(authService);
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    await controller.revokeMySession("session-2", user);

    expect(authService.revokeMySession).toHaveBeenCalledWith("session-2", user);
  });

  it("delegates admin session listing and revocation to auth service", async () => {
    const authService = {
      listUserSessionsForAdmin: vi.fn().mockResolvedValue([]),
      revokeUserSessionForAdmin: vi.fn().mockResolvedValue({ success: true })
    } as any;
    const controller = new AuthController(authService);
    const admin = {
      id: "admin-1",
      permissions: ["user:write"]
    } as any;

    await controller.listUserSessionsForAdmin("user-2", admin);
    await controller.revokeUserSessionForAdmin("user-2", "session-2", admin);

    expect(authService.listUserSessionsForAdmin).toHaveBeenCalledWith("user-2", admin);
    expect(authService.revokeUserSessionForAdmin).toHaveBeenCalledWith("user-2", "session-2", admin);
  });

  it("delegates password reset and mfa flows to auth service", async () => {
    const authService = {
      requestPasswordReset: vi.fn().mockResolvedValue({ success: true }),
      resetPassword: vi.fn().mockResolvedValue({ success: true }),
      configureMfa: vi.fn().mockResolvedValue({ enabled: true, pending: false, challenge: null, recoveryCodes: [] }),
      verifyMfa: vi.fn().mockResolvedValue({ success: true }),
      getMfaStatus: vi.fn().mockResolvedValue({ enabled: true, pending: false, configuredAt: "2026-05-04T00:00:00.000Z" }),
      verifyLoginMfa: vi.fn().mockResolvedValue({
        success: true,
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        mfaTicket: null,
        mfaChallengeType: null,
        mfaSetupChallenge: null,
        mfaRecoveryCodes: ["code-1"],
        accessToken: "token",
        refreshToken: "refresh",
        sessionExpiresAt: "2026-05-01T00:00:00.000Z",
        user: null
      })
    } as any;
    const controller = new AuthController(authService);
    const user = {
      id: "user-1"
    } as any;
    const response = {
      cookie: vi.fn()
    } as any;

    await controller.requestPasswordReset({ identifier: "admin" });
    await controller.resetPassword({ token: "token-1", password: "Password123!A" });
    await controller.configureMfa(user, {});
    await controller.verifyMfa(user, { code: "123456" });
    await controller.getMfaStatus(user);
    await controller.verifyLoginMfa({ ticket: "ticket-1", code: "123456" }, response);

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({ identifier: "admin" });
    expect(authService.resetPassword).toHaveBeenCalledWith({ token: "token-1", password: "Password123!A" });
    expect(authService.configureMfa).toHaveBeenCalledWith(user, {});
    expect(authService.verifyMfa).toHaveBeenCalledWith(user, { code: "123456" });
    expect(authService.getMfaStatus).toHaveBeenCalledWith(user);
    expect(authService.verifyLoginMfa).toHaveBeenCalledWith({ ticket: "ticket-1", code: "123456" });
    expect(response.cookie).toHaveBeenCalledWith("platform_access_token", "token", expect.any(Object));
  });
});
