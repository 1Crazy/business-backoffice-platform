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

  it("stores access token but never stores browser-readable refresh token after login", async () => {
    window.localStorage.setItem("platform-refresh-token", "legacy-refresh");
    postMock.mockResolvedValue({
      data: {
        accessToken: "access-1",
        sessionExpiresAt: "2026-04-06T00:00:00.000Z",
        user: {
          id: "user-1",
          username: "member",
          displayName: "员工",
          roleCodes: ["sales-member"],
          permissions: ["customer:read"]
        }
      }
    });

    const store = useAuthStore();
    await store.login("member", "Password123");

    expect(store.token).toBe("access-1");
    expect(window.localStorage.getItem("platform-access-token")).toBe("access-1");
    expect(window.localStorage.getItem("platform-refresh-token")).toBeNull();
  });

  it("clears legacy refresh token after logout", async () => {
    window.localStorage.setItem("platform-access-token", "access-1");
    window.localStorage.setItem("platform-refresh-token", "legacy-refresh");
    postMock.mockResolvedValue({ data: { success: true } });

    const store = useAuthStore();
    await store.logout();

    expect(postMock).toHaveBeenCalledWith("/auth/logout");
    expect(window.localStorage.getItem("platform-access-token")).toBeNull();
    expect(window.localStorage.getItem("platform-refresh-token")).toBeNull();
    expect(store.token).toBeNull();
  });
});
