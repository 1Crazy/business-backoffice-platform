import { flushPromises, shallowMount } from "@vue/test-utils";

import CustomersPage from "./CustomersPage.vue";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn()
}));

vi.mock("../api/http", () => ({
  http: {
    get: getMock,
    post: vi.fn(),
    patch: vi.fn()
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn()
  }
}));

describe("CustomersPage", () => {
  it("requests filtered customer data when keyword changes", async () => {
    getMock.mockReset();
    getMock.mockImplementation((url: string, options?: { params?: Record<string, unknown> }) => {
      if (url === "/users") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/customers/tags") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/dictionaries") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/customers") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    const wrapper = shallowMount(CustomersPage, {
      global: {
        stubs: {
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
          "el-drawer": true,
          "el-timeline": true,
          "el-timeline-item": true,
          "el-date-picker": true,
          "RecordUploadPanel": true
        }
      }
    });
    await flushPromises();

    (wrapper.vm as any).filters.keyword = "Acme";
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith("/customers", {
      params: {
        keyword: "Acme",
        source: undefined,
        status: undefined,
        ownerId: undefined,
        tagId: undefined
      }
    });
  });
});
