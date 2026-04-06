import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import AppLayout from "./AppLayout.vue";

const pushMock = vi.fn();

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({
    currentUser: {
      displayName: "Mock User",
      permissions: ["oa:workspace:view"]
    },
    hasPermission: () => true,
    logout: vi.fn()
  })
}));

vi.mock("@/router", () => ({
  router: {
    getRoutes: () => [
      { path: "/workspace", meta: { title: "工作台" } },
      { path: "/approvals/pending", meta: { title: "待我审批" } },
      { path: "/no-access", meta: { title: "权限待配置", hidden: true } }
    ]
  }
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    path: "/workspace",
    meta: { title: "工作台" },
    matched: [
      { path: "/", meta: { title: "OA" } },
      { path: "/workspace", meta: { title: "工作台" }, name: "workspace" }
    ]
  }),
  useRouter: () => ({
    push: pushMock
  }),
  RouterView: vi.fn()
}));

describe("AppLayout", () => {
  it("renders the workspace title and forwards navigation events", () => {
    const wrapper = mount(AppLayout, {
      global: {
        stubs: {
          LayoutSidebarNav: true,
          LayoutMobileNav: true,
          RouterView: true,
          "el-button": true
        }
      }
    });

    expect(wrapper.text()).toContain("工作台");
    wrapper.vm.handleNavigate("/approvals/pending");
    expect(pushMock).toHaveBeenCalledWith("/approvals/pending");
  });
});
