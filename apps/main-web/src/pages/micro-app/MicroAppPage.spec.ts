// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";

import MicroAppPage from "./MicroAppPage.vue";

const pushMock = vi.fn();
const routeState = reactive({
  meta: {
    microAppName: "oa-web",
    title: "工作台"
  }
});
const microRuntimeState = reactive({
  initialized: true,
  loadingAppName: null as string | null,
  errors: {} as Record<string, { message: string; entry: string } | undefined>
});

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({
    currentUser: {
      permissions: ["oa:workspace:view"]
    }
  })
}));

vi.mock("@/micro/runtime", () => ({
  useMicroRuntimeState: () => microRuntimeState
}));

describe("MicroAppPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    microRuntimeState.loadingAppName = null;
    microRuntimeState.errors = {};
    routeState.meta = {
      microAppName: "oa-web",
      title: "工作台"
    };
  });

  it("shows diagnostic details when a micro app fails to load", () => {
    microRuntimeState.errors["oa-web"] = {
      message: "Failed to fetch",
      entry: "http://localhost:5174"
    };

    const wrapper = mount(MicroAppPage, {
      global: {
        stubs: {
          "el-button": {
            template: "<button><slot /></button>"
          }
        }
      }
    });

    expect(wrapper.text()).toContain("子应用异常");
    expect(wrapper.text()).toContain("oa-web");
    expect(wrapper.text()).toContain("http://localhost:5174");
    expect(wrapper.text()).toContain("Failed to fetch");
  });

  it("falls back to the first accessible page from the error state", async () => {
    microRuntimeState.errors["oa-web"] = {
      message: "Failed to fetch",
      entry: "http://localhost:5174"
    };

    const wrapper = mount(MicroAppPage, {
      global: {
        stubs: {
          "el-button": {
            template: "<button @click='$emit(\"click\")'><slot /></button>"
          }
        }
      }
    });

    await wrapper.findAll("button")[1].trigger("click");

    expect(pushMock).toHaveBeenCalledWith("/workfeed");
  });
});
