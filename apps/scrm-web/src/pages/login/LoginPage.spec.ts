import { shallowMount } from "@vue/test-utils";
import { nextTick } from "vue";

import LoginPage from "@/pages/login/LoginPage.vue";

const { pushMock, loginMock, successMock, warningMock, authStoreState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  loginMock: vi.fn().mockResolvedValue(undefined),
  successMock: vi.fn(),
  warningMock: vi.fn(),
  authStoreState: {
    currentUser: {
      permissions: ["dashboard:view"]
    },
    logout: vi.fn()
  }
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({
    login: loginMock,
    logout: authStoreState.logout,
    get currentUser() {
      return authStoreState.currentUser;
    }
  })
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock
    })
  };
});

vi.mock("element-plus", () => ({
  ElMessage: {
    success: successMock,
    error: vi.fn(),
    warning: warningMock
  }
}));

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    loginMock.mockResolvedValue(undefined);
    successMock.mockReset();
    warningMock.mockReset();
    authStoreState.logout.mockReset();
    authStoreState.currentUser = {
      permissions: ["dashboard:view"]
    };
  });

  it("submits default credentials through the auth store", async () => {
    const wrapper = shallowMount(LoginPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-button": {
            template: "<button class='submit-button' @click='$emit(\"click\")'><slot /></button>"
          }
        }
      }
    });
    (wrapper.vm as any).loginFormRef = {
      validate: vi.fn().mockResolvedValue(true)
    };

    await (wrapper.vm as any).handleSubmit();
    await nextTick();

    expect(loginMock).toHaveBeenCalledWith("admin", "Admin123456!");
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(successMock).toHaveBeenCalled();
  });

  it("redirects to the first accessible page when dashboard is unavailable", async () => {
    authStoreState.currentUser = {
      permissions: ["customer:read"]
    };

    const wrapper = shallowMount(LoginPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-button": {
            template: "<button class='submit-button' @click='$emit(\"click\")'><slot /></button>"
          }
        }
      }
    });
    (wrapper.vm as any).loginFormRef = {
      validate: vi.fn().mockResolvedValue(true)
    };

    await (wrapper.vm as any).handleSubmit();
    await nextTick();

    expect(pushMock).toHaveBeenCalledWith("/customers");
    expect(successMock).toHaveBeenCalled();
  });

  it("redirects to the no-access page when the account has no page permissions", async () => {
    authStoreState.currentUser = {
      permissions: []
    };

    const wrapper = shallowMount(LoginPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-button": {
            template: "<button class='submit-button' @click='$emit(\"click\")'><slot /></button>"
          }
        }
      }
    });
    (wrapper.vm as any).loginFormRef = {
      validate: vi.fn().mockResolvedValue(true)
    };

    await (wrapper.vm as any).handleSubmit();
    await nextTick();

    expect(pushMock).toHaveBeenCalledWith("/no-access");
    expect(authStoreState.logout).not.toHaveBeenCalled();
    expect(warningMock).toHaveBeenCalledWith("当前账号没有可访问的页面，请联系管理员分配权限。");
  });
});
