import { describe, expect, it, beforeEach, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";

import LoginPage from "./LoginPage.vue";

const pushMock = vi.fn(() => Promise.resolve());

const authStore = {
  currentUser: null as { permissions: string[] } | null,
  login: vi.fn(async () => {
    authStore.currentUser = { permissions: [] };
  })
};

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => authStore
}));

vi.mock("@/router/access", () => ({
  resolveFirstAccessiblePath: vi.fn()
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock
    })
  };
});

vi.mock("element-plus", () => ({
  ElMessage: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("@/utils/request", () => ({
  validateForm: vi.fn().mockResolvedValue(true),
  getRequestErrorMessage: vi.fn(() => "请求失败")
}));

const FormStub = defineComponent({
  setup(_, { expose, slots }) {
    expose({
      validate: vi.fn().mockResolvedValue(true)
    });
    return () => h("form", slots.default?.());
  }
});

const FormItemStub = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});

const InputStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      default: ""
    }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        value: props.modelValue,
        onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLInputElement).value)
      });
  }
});

const ButtonStub = defineComponent({
  emits: ["click"],
  setup(_, { emit, slots }) {
    return () => h("button", { onClick: () => emit("click") }, slots.default?.());
  }
});

describe("LoginPage", () => {
  let resolveFirstAccessiblePathMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    pushMock.mockClear();
    authStore.currentUser = null;
    (authStore.login as ReturnType<typeof vi.fn>).mockClear();

    const module = await import("@/router/access");
    resolveFirstAccessiblePathMock = vi.mocked(module.resolveFirstAccessiblePath);
    resolveFirstAccessiblePathMock.mockClear();
  });

  it("redirects to /no-access when no OA route is available", async () => {
    resolveFirstAccessiblePathMock.mockReturnValue(null);

    const wrapper = mount(LoginPage, {
      global: {
        components: {
          "el-form": FormStub,
          "el-form-item": FormItemStub,
          "el-input": InputStub,
          "el-button": ButtonStub
        }
      }
    });

    await wrapper.vm.handleSubmit();

    expect(authStore.login).toHaveBeenCalled();
    expect(resolveFirstAccessiblePathMock).toHaveBeenCalledWith([]);
    expect(pushMock).toHaveBeenCalledWith("/no-access");
  });
});
