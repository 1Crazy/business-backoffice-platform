// @vitest-environment jsdom

import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

const { postMock, getMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    post: postMock,
    get: getMock
  }
}));

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
    postMock.mockReset();
    getMock.mockReset();
  });

  it("stores only non-sensitive session metadata after login", async () => {
    window.localStorage.setItem("platform-access-token", "legacy-access");
    window.localStorage.setItem("platform-refresh-token", "legacy-refresh");
    postMock.mockResolvedValue({
      data: {
        success: true,
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        mfaTicket: null,
        mfaChallengeType: null,
        mfaSetupChallenge: null,
        mfaRecoveryCodes: [],
        sessionExpiresAt: "2026-04-06T00:00:00.000Z",
        user: {
          id: "user-1",
          tenantId: "tenant-1",
          tenantCode: "tenant-1",
          username: "member",
          displayName: "员工",
          roleCodes: ["sales-member"],
          permissions: ["customer:read"]
        }
      }
    });

    const store = useAuthStore();
    await store.login("member", "Password123");

    expect(store.sessionExpiresAt).toBe("2026-04-06T00:00:00.000Z");
    expect(window.localStorage.getItem("platform-session-expires-at")).toBe("2026-04-06T00:00:00.000Z");
    expect(window.localStorage.getItem("platform-access-token")).toBeNull();
    expect(window.localStorage.getItem("platform-refresh-token")).toBeNull();
  });

  it("keeps the user unauthenticated while waiting for mfa verification", async () => {
    postMock.mockResolvedValue({
      data: {
        success: false,
        mfaRequired: true,
        mfaEnrollmentRequired: true,
        mfaTicket: "ticket-1",
        mfaChallengeType: "totp",
        mfaSetupChallenge: "otpauth://totp/test",
        mfaRecoveryCodes: [],
        sessionExpiresAt: null,
        user: null
      }
    });

    const store = useAuthStore();
    const result = await store.login("member", "Password123");

    expect(result.mfaRequired).toBe(true);
    expect(store.isAuthenticated).toBe(false);
    expect(store.pendingMfa).toMatchObject({
      ticket: "ticket-1",
      enrollmentRequired: true
    });
    expect(window.localStorage.getItem("platform-session-expires-at")).toBeNull();
  });

  it("stores session metadata only after completing mfa verification", async () => {
    postMock
      .mockResolvedValueOnce({
        data: {
          success: false,
          mfaRequired: true,
          mfaEnrollmentRequired: false,
          mfaTicket: "ticket-2",
          mfaChallengeType: "totp",
          mfaSetupChallenge: null,
          mfaRecoveryCodes: [],
          sessionExpiresAt: null,
          user: null
        }
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          mfaRequired: false,
          mfaEnrollmentRequired: false,
          mfaTicket: null,
          mfaChallengeType: null,
          mfaSetupChallenge: null,
          mfaRecoveryCodes: ["recovery-1"],
          sessionExpiresAt: "2026-04-06T00:00:00.000Z",
          user: {
            id: "user-1",
            username: "member",
            displayName: "员工",
            tenantId: "tenant-1",
            tenantCode: "tenant-1",
            roleCodes: ["sales-member"],
            permissions: ["customer:read"]
          }
        }
      });

    const store = useAuthStore();
    await store.login("member", "Password123");
    const result = await store.completeMfa("123456");

    expect(postMock).toHaveBeenNthCalledWith(2, "/auth/mfa/login/verify", {
      ticket: "ticket-2",
      code: "123456"
    });
    expect(result.success).toBe(true);
    expect(store.isAuthenticated).toBe(true);
    expect(store.pendingMfa).toBeNull();
    expect(store.latestRecoveryCodes).toEqual(["recovery-1"]);
    expect(window.localStorage.getItem("platform-session-expires-at")).toBe("2026-04-06T00:00:00.000Z");
  });

  it("clears legacy refresh token after logout", async () => {
    window.localStorage.setItem("platform-access-token", "access-1");
    window.localStorage.setItem("platform-refresh-token", "legacy-refresh");
    window.localStorage.setItem("platform-session-expires-at", "2026-04-06T00:00:00.000Z");
    postMock.mockResolvedValue({ data: { success: true } });

    const store = useAuthStore();
    await store.logout();

    expect(postMock).toHaveBeenCalledWith("/auth/logout");
    expect(window.localStorage.getItem("platform-access-token")).toBeNull();
    expect(window.localStorage.getItem("platform-refresh-token")).toBeNull();
    expect(window.localStorage.getItem("platform-session-expires-at")).toBeNull();
    expect(store.sessionExpiresAt).toBeNull();
  });
});
