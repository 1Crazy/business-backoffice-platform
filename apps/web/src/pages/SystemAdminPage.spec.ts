import { flushPromises, shallowMount } from "@vue/test-utils";

import SystemAdminPage from "./SystemAdminPage.vue";

const { getMock, postMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn()
}));

vi.mock("../api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
    patch: patchMock
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe("SystemAdminPage", () => {
  it("requests paginated audit logs when the actor filter changes", async () => {
    getMock.mockReset();
    getMock.mockImplementation((url: string) => {
      if (url === "/dictionaries") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/audit-logs") {
        return Promise.resolve({
          data: {
            items: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            sortBy: "createdAt",
            sortOrder: "desc"
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    const wrapper = shallowMount(SystemAdminPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-select": true,
          "el-option": true,
          "el-date-picker": true,
          "el-button": true,
          "el-table": true,
          "el-table-column": true,
          "el-empty": true,
          "el-pagination": true,
          "el-dialog": true,
          "el-row": true,
          "el-col": true,
          "el-input-number": true,
          "el-switch": true
        }
      }
    });
    await flushPromises();

    (wrapper.vm as any).auditFilter.actorName = "管理员";
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith("/audit-logs", {
      params: {
        actorName: "管理员",
        actionType: undefined,
        targetType: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      }
    });
  });
});
