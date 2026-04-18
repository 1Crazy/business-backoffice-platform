// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductConfigurationPage from "@/pages/product-configuration/ProductConfigurationPage.vue";

const { getMock, patchMock, successMock, errorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  patchMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    patch: patchMock
  }
}));

vi.mock("element-plus", async () => {
  const actual = await vi.importActual<typeof import("element-plus")>("element-plus");

  return {
    ...actual,
    ElMessage: {
      success: successMock,
      error: errorMock
    }
  };
});

const globalStubs = {
  "el-table": true,
  "el-table-column": true,
  "el-tag": true,
  "el-input": true,
  "el-button": true,
  "el-dialog": true,
  "el-form": true,
  "el-form-item": true,
  "el-switch": true
};

const entryFixture = {
  scope: "MENU",
  configKey: "platform-workfeed",
  displayName: "统一待办入口",
  description: "说明",
  effectiveSource: "TENANT_OVERRIDE",
  effectiveValue: {
    visible: false,
    label: "协同总线"
  },
  platformDefaultValue: {
    visible: true,
    label: "统一待办/通知"
  },
  industryTemplateValue: null,
  tenantOverrideValue: {
    visible: false,
    label: "协同总线"
  },
  sources: {
    platformDefault: {
      displayName: "默认",
      description: null,
      updatedAt: "2026-04-18T00:00:00.000Z"
    },
    industryTemplate: null,
    tenantOverride: {
      displayName: "覆盖",
      description: null,
      updatedAt: "2026-04-18T01:00:00.000Z"
    }
  }
};

describe("ProductConfigurationPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    patchMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();

    getMock
      .mockResolvedValueOnce({ data: [entryFixture] })
      .mockResolvedValueOnce({ data: [entryFixture] })
      .mockResolvedValue({ data: { brandName: "Acme Workspace", hiddenNavigationKeys: [], navigationLabels: {} } });
    patchMock.mockResolvedValue({ data: {} });
  });

  it("sends menu overrides with normalized payload", async () => {
    const wrapper = shallowMount(ProductConfigurationPage, {
      global: {
        stubs: globalStubs,
        plugins: [createPinia()]
      }
    });
    await flushPromises();

    await (wrapper.vm as any).openEditDialog(entryFixture);
    (wrapper.vm as any).formRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).overrideForm.displayName = " 协同入口 ";
    (wrapper.vm as any).overrideForm.description = " 自定义主导航 ";
    (wrapper.vm as any).overrideForm.label = " 协同总线 ";
    (wrapper.vm as any).overrideForm.visible = false;

    await (wrapper.vm as any).submitOverride();

    expect(patchMock).toHaveBeenCalledWith("/product-configuration/entries/MENU/platform-workfeed", {
      displayName: "协同入口",
      description: "自定义主导航",
      value: {
        visible: false,
        label: "协同总线"
      }
    });
  });
});
