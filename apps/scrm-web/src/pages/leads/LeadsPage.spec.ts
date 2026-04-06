import { flushPromises, shallowMount } from "@vue/test-utils";

import LeadsPage from "@/pages/leads/LeadsPage.vue";

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn().mockResolvedValue({ data: {} })
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
    patch: vi.fn()
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe("LeadsPage", () => {
  it("posts to the lead conversion endpoint when converting a lead", async () => {
    getMock.mockReset();
    postMock.mockReset();
    postMock.mockResolvedValue({ data: {} });
    getMock.mockImplementation((url: string) => {
      if (url === "/users" || url === "/dictionaries") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/leads") {
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
      if (url === "/leads/reminders") {
        return Promise.resolve({
          data: {
            items: [],
            page: 1,
            pageSize: 5,
            total: 0,
            totalPages: 0,
            sortBy: "remindAt",
            sortOrder: "asc"
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    const wrapper = shallowMount(LeadsPage, {
      global: {
        stubs: {
          "el-button": true,
          "el-empty": true,
          "el-pagination": true,
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-select": true,
          "el-option": true,
          "el-table": true,
          "el-table-column": true,
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

    await (wrapper.vm as any).convertLead({
      id: "lead-1"
    });

    expect(postMock).toHaveBeenCalledWith("/leads/lead-1/convert");
  });
});
