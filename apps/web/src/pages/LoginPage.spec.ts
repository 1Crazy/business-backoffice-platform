import { shallowMount } from "@vue/test-utils";
import { nextTick } from "vue";

import LoginPage from "./LoginPage.vue";

const { pushMock, loginMock, successMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  loginMock: vi.fn().mockResolvedValue(undefined),
  successMock: vi.fn()
}));

vi.mock("../stores/auth", () => ({
  useAuthStore: () => ({
    login: loginMock
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
    error: vi.fn()
  }
}));

describe("LoginPage", () => {
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
});
