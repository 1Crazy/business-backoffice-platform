import { mount } from "@vue/test-utils";

import AppLayout from "./AppLayout.vue";

const { pushMock, getRoutesMock, hasPermissionMock, logoutMock, routeState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  getRoutesMock: vi.fn(),
  hasPermissionMock: vi.fn(),
  logoutMock: vi.fn(),
  routeState: {
    path: "/dashboard",
    meta: {
      title: "运营看板"
    }
  }
}));

vi.mock("../router", () => ({
  router: {
    getRoutes: getRoutesMock
  }
}));

vi.mock("../stores/auth", () => ({
  useAuthStore: () => ({
    currentUser: {
      displayName: "系统管理员"
    },
    hasPermission: hasPermissionMock,
    logout: logoutMock
  })
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return {
    ...actual,
    useRoute: () => routeState,
    useRouter: () => ({
      push: pushMock
    })
  };
});

describe("AppLayout", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getRoutesMock.mockReset();
    hasPermissionMock.mockReset();
    logoutMock.mockReset();

    getRoutesMock.mockReturnValue([
      { path: "/", meta: {} },
      { path: "/login", meta: { title: "登录" } },
      { path: "/dashboard", meta: { title: "运营看板", permission: "dashboard:view" } },
      { path: "/customers", meta: { title: "客户中心", permission: "customer:read" } },
      { path: "/no-access", meta: { title: "权限待配置", hideInMenu: true } }
    ]);
    hasPermissionMock.mockReturnValue(true);
  });

  it("hides routes that are marked as hidden in the menu", () => {
    const wrapper = mount(AppLayout, {
      global: {
        stubs: {
          RouterView: {
            template: "<div />"
          },
          "el-menu": {
            props: ["defaultActive", "router"],
            template: "<div class='menu-stub'><slot /></div>"
          },
          "el-menu-item": {
            props: ["index"],
            template: "<div class='menu-item'><slot /></div>"
          },
          "el-button": {
            template: "<button><slot /></button>"
          }
        }
      }
    });

    expect(wrapper.text()).toContain("运营看板");
    expect(wrapper.text()).toContain("客户中心");
    expect(wrapper.text()).not.toContain("权限待配置");
  });
});
