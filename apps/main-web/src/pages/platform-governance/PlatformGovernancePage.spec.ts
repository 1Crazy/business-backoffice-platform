// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PlatformGovernancePage from "@/pages/platform-governance/PlatformGovernancePage.vue";

const { getMock, postMock, patchMock, pushMock, successMock, errorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  pushMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn()
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    path: "/platform/organization/departments",
    meta: {
      governanceTab: "departments"
    }
  }),
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
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
  "el-tabs": true,
  "el-tab-pane": true,
  "el-form": true,
  "el-form-item": true,
  "el-input": true,
  "el-select": true,
  "el-option": true,
  "el-button": true,
  "el-table": true,
  "el-table-column": true,
  "el-tag": true,
  "el-row": true,
  "el-col": true,
  "el-dialog": true,
  "el-checkbox-group": true,
  "el-checkbox": true
};

describe("PlatformGovernancePage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();

    getMock.mockResolvedValue({ data: [] });
    postMock.mockResolvedValue({ data: {} });
    patchMock.mockResolvedValue({ data: {} });
  });

  it("normalizes department create payloads before posting", async () => {
    const wrapper = shallowMount(PlatformGovernancePage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).departmentFormRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).departmentForm.name = " 北区销售 ";
    (wrapper.vm as any).departmentForm.code = " SALES-NORTH ";
    (wrapper.vm as any).departmentForm.parentId = null;

    await (wrapper.vm as any).submitDepartment();

    expect(postMock).toHaveBeenCalledWith("/departments", {
      name: "北区销售",
      code: "SALES-NORTH",
      parentId: undefined
    });
  });

  it("routes to the matching platform governance path when switching tabs", async () => {
    const wrapper = shallowMount(PlatformGovernancePage, {
      global: {
        stubs: globalStubs
      }
    });

    await (wrapper.vm as any).handleTabChange("roles");

    expect(pushMock).toHaveBeenCalledWith("/platform/access/roles");
  });
});
