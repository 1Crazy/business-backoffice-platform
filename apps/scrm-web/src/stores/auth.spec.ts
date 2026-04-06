import { createPinia, setActivePinia } from "pinia";

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

  it("stores both access token and refresh token after login", async () => {
    postMock.mockResolvedValue({
      data: {
        accessToken: "access-1",
        refreshToken: "refresh-1",
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
    await store.login("member", "123123123");

    expect(store.token).toBe("access-1");
    expect(store.refreshToken).toBe("refresh-1");
    expect(window.localStorage.getItem("scrm-token")).toBe("access-1");
    expect(window.localStorage.getItem("scrm-refresh-token")).toBe("refresh-1");
  });

  it("clears the local session after logout", async () => {
    window.localStorage.setItem("scrm-token", "access-1");
    window.localStorage.setItem("scrm-refresh-token", "refresh-1");
    postMock.mockResolvedValue({ data: { success: true } });

    const store = useAuthStore();
    await store.logout();

    expect(postMock).toHaveBeenCalledWith("/auth/logout");
    expect(window.localStorage.getItem("scrm-token")).toBeNull();
    expect(window.localStorage.getItem("scrm-refresh-token")).toBeNull();
    expect(store.token).toBeNull();
    expect(store.refreshToken).toBeNull();
  });
});
