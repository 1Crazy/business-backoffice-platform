import { flushPromises, shallowMount } from "@vue/test-utils";

import OpportunitiesPage from "@/pages/opportunities/OpportunitiesPage.vue";

const { getMock, postMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
    patch: patchMock
  }
}));

vi.mock("element-plus", async () => {
  const actual = await vi.importActual("element-plus");

  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn()
    }
  };
});

describe("OpportunitiesPage", () => {
  it("requests filtered opportunity data when keyword changes", async () => {
    getMock.mockReset();
    getMock.mockImplementation((url: string) => {
      if (url === "/users") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/customers" || url === "/leads") {
        return Promise.resolve({
          data: {
            items: [],
            page: 1,
            pageSize: 100,
            total: 0,
            totalPages: 0,
            sortBy: "updatedAt",
            sortOrder: "desc"
          }
        });
      }
      if (url === "/sales-opportunities") {
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

    const wrapper = shallowMount(OpportunitiesPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-input-number": true,
          "el-select": true,
          "el-option": true,
          "el-button": true,
          "el-table": true,
          "el-table-column": true,
          "el-tag": true,
          "el-empty": true,
          "el-pagination": true,
          "el-row": true,
          "el-col": true,
          "el-dialog": true,
          "el-drawer": true,
          "el-date-picker": true,
          "el-descriptions": true,
          "el-descriptions-item": true,
          "el-timeline": true,
          "el-timeline-item": true,
          "el-alert": true
        }
      }
    });
    await flushPromises();

    (wrapper.vm as any).filters.keyword = "Acme";
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith("/sales-opportunities", {
      params: {
        keyword: "Acme",
        customerId: undefined,
        ownerId: undefined,
        stage: undefined,
        resultStatus: undefined,
        expectedCloseDateStart: undefined,
        expectedCloseDateEnd: undefined,
        closedAtStart: undefined,
        closedAtEnd: undefined,
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      }
    });
  });

  it("keeps closedAt filters empty after clearing the close date range", async () => {
    getMock.mockReset();
    getMock.mockImplementation((url: string) => {
      if (url === "/users") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/customers" || url === "/leads") {
        return Promise.resolve({
          data: {
            items: [],
            page: 1,
            pageSize: 100,
            total: 0,
            totalPages: 0,
            sortBy: "updatedAt",
            sortOrder: "desc"
          }
        });
      }
      if (url === "/sales-opportunities") {
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

    const wrapper = shallowMount(OpportunitiesPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-input-number": true,
          "el-select": true,
          "el-option": true,
          "el-button": true,
          "el-table": true,
          "el-table-column": true,
          "el-tag": true,
          "el-empty": true,
          "el-pagination": true,
          "el-row": true,
          "el-col": true,
          "el-dialog": true,
          "el-drawer": true,
          "el-date-picker": true,
          "el-descriptions": true,
          "el-descriptions-item": true,
          "el-timeline": true,
          "el-timeline-item": true,
          "el-alert": true
        }
      }
    });
    await flushPromises();

    (wrapper.vm as any).filters.closedAtRange = null;
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith("/sales-opportunities", {
      params: {
        keyword: undefined,
        customerId: undefined,
        ownerId: undefined,
        stage: undefined,
        resultStatus: undefined,
        expectedCloseDateStart: undefined,
        expectedCloseDateEnd: undefined,
        closedAtStart: undefined,
        closedAtEnd: undefined,
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      }
    });
  });

  it("loads opportunity detail before opening the detail drawer", async () => {
    getMock.mockReset();
    getMock.mockImplementation((url: string) => {
      if (url === "/users") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/customers" || url === "/leads") {
        return Promise.resolve({
          data: {
            items: [],
            page: 1,
            pageSize: 100,
            total: 0,
            totalPages: 0,
            sortBy: "updatedAt",
            sortOrder: "desc"
          }
        });
      }
      if (url === "/sales-opportunities") {
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
      if (url === "/sales-opportunities/opportunity-1") {
        return Promise.resolve({
          data: {
            id: "opportunity-1",
            name: "Acme 年度框架合作",
            customerId: "customer-1",
            customer: {
              id: "customer-1",
              name: "Acme"
            },
            ownerId: "user-1",
            owner: {
              id: "user-1",
              username: "sales",
              displayName: "销售",
              email: null,
              phone: null,
              status: "ACTIVE",
              departmentId: "dept-1"
            },
            stage: "NEGOTIATION",
            resultStatus: "IN_PROGRESS",
            expectedAmount: 120000,
            expectedCloseDate: "2026-04-30T10:00:00.000Z",
            nextAction: "推进预算审批",
            notes: null,
            closedAt: null,
            lostReason: null,
            stageHistory: [],
            createdAt: "2026-04-05T10:00:00.000Z",
            updatedAt: "2026-04-06T10:00:00.000Z"
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    const wrapper = shallowMount(OpportunitiesPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-input-number": true,
          "el-select": true,
          "el-option": true,
          "el-button": true,
          "el-table": true,
          "el-table-column": true,
          "el-tag": true,
          "el-empty": true,
          "el-pagination": true,
          "el-row": true,
          "el-col": true,
          "el-dialog": true,
          "el-drawer": true,
          "el-date-picker": true,
          "el-descriptions": true,
          "el-descriptions-item": true,
          "el-timeline": true,
          "el-timeline-item": true,
          "el-alert": true
        }
      }
    });
    await flushPromises();

    await (wrapper.vm as any).openDetailDrawer({ id: "opportunity-1" });
    await flushPromises();

    expect(getMock).toHaveBeenCalledWith("/sales-opportunities/opportunity-1");
  });
});
