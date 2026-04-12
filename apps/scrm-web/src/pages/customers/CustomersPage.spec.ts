import { flushPromises, shallowMount } from "@vue/test-utils";

import CustomersPage from "@/pages/customers/CustomersPage.vue";

const { getMock, pushMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  pushMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: vi.fn(),
    patch: vi.fn()
  }
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
    success: vi.fn(),
    error: vi.fn()
  }
}));

const defaultResponses: Record<string, unknown> = {
  "/users": { data: [] },
  "/customers/tags": { data: [] },
  "/dictionaries": { data: [] },
  "/customers": {
    data: {
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      sortBy: "createdAt",
      sortOrder: "desc"
    }
  },
  "/customers/customer-1": {
    data: {
      id: "customer-1",
      name: "Acme",
      ownerId: "user-1",
      tags: []
    }
  },
  "/customers/customer-1/follow-ups": { data: [] },
  "/revenue-operations/customers/customer-1": {
    data: {
      customerId: "customer-1",
      quotes: [],
      contracts: [],
      paymentPlans: [],
      paymentRecords: [],
      renewalReminders: []
    }
  }
};

const pageStubs = {
  "el-form": true,
  "el-form-item": true,
  "el-input": true,
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
  "el-timeline": true,
  "el-timeline-item": true,
  "el-date-picker": true,
  "RecordUploadPanel": true
};

function configureGetMock(overrides: Record<string, unknown> = {}): void {
  getMock.mockImplementation((url: string) => {
    if (Object.prototype.hasOwnProperty.call(overrides, url)) {
      return Promise.resolve(overrides[url]);
    }

    if (Object.prototype.hasOwnProperty.call(defaultResponses, url)) {
      return Promise.resolve(defaultResponses[url]);
    }

    return Promise.resolve({ data: [] });
  });
}

function mountCustomersPage() {
  return shallowMount(CustomersPage, {
    global: {
      stubs: pageStubs
    }
  });
}

describe("CustomersPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    pushMock.mockReset();
    configureGetMock();
  });

  it("requests filtered customer data when keyword changes", async () => {
    const wrapper = mountCustomersPage();
    await flushPromises();

    (wrapper.vm as any).filters.keyword = "Acme";
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith("/customers", {
      params: {
        keyword: "Acme",
        source: undefined,
        status: undefined,
        ownerId: undefined,
        tagId: undefined,
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      }
    });
  });

  it("loads customer detail and follow-up history before opening the drawer", async () => {
    const wrapper = mountCustomersPage();
    await flushPromises();

    await (wrapper.vm as any).openFollowUpDrawer({ id: "customer-1" });
    await flushPromises();

    expect(getMock).toHaveBeenCalledWith("/customers/customer-1");
    expect(getMock).toHaveBeenCalledWith("/customers/customer-1/follow-ups");
    expect(getMock).toHaveBeenCalledWith("/revenue-operations/customers/customer-1");
  });
});
