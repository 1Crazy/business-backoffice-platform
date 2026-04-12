import { flushPromises, shallowMount } from "@vue/test-utils";

import RevenueOperationsPage from "@/pages/revenue-operations/RevenueOperationsWorkspacePage.vue";

const routeState = {
  query: {
    customerId: "customer-1",
    opportunityId: "opportunity-1"
  }
};

const { getMock, postMock, replaceMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  replaceMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock
  }
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");

  return {
    ...actual,
    useRoute: () => routeState,
    useRouter: () => ({
      replace: replaceMock
    })
  };
});

vi.mock("element-plus", async () => {
  const actual = await vi.importActual("element-plus");

  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    }
  };
});

function mockCustomers(): void {
  getMock.mockImplementation((url: string) => {
    if (url === "/customers") {
      return Promise.resolve({
        data: {
          items: [
            { id: "customer-1", name: "Acme", ownerId: "user-1", owner: {}, tags: [] }
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
          sortBy: "updatedAt",
          sortOrder: "desc"
        }
      });
    }

    if (url === "/customers/customer-1") {
      return Promise.resolve({
        data: {
          id: "customer-1",
          name: "Acme",
          ownerId: "user-1",
          tags: []
        }
      });
    }

    if (url === "/revenue-operations/customers/customer-1") {
      return Promise.resolve({
        data: {
          customerId: "customer-1",
          quotes: [],
          paymentPlans: [
            {
              id: "plan-1",
              title: "首期款",
              plannedAmount: 160000,
              receivedAmount: 80000,
              status: "PARTIAL",
              plannedDate: "2026-04-20T00:00:00.000Z",
              customerId: "customer-1",
              opportunityId: "opportunity-1",
              contractId: "contract-1",
              ownerId: "user-1",
              createdAt: "2026-04-10T10:00:00.000Z",
              updatedAt: "2026-04-10T10:00:00.000Z"
            }
          ],
          paymentRecords: [],
          renewalReminders: [],
          contracts: [
            {
              id: "contract-1",
              contractNo: "C-001",
              title: "Acme 年度框架合同",
              amount: 320000,
              status: "ACTIVE",
              startDate: "2026-04-15",
              endDate: "2027-04-14",
              signedAt: null,
              notes: null,
              customerId: "customer-1",
              opportunityId: "opportunity-1",
              ownerId: "user-1",
              createdAt: "2026-04-10T10:00:00.000Z",
              updatedAt: "2026-04-10T10:00:00.000Z"
            }
          ]
        }
      });
    }

    if (url === "/sales-opportunities") {
      return Promise.resolve({
        data: {
          items: [
            {
              id: "opportunity-1",
              name: "Acme 年度框架合作",
              customerId: "customer-1",
              customer: { id: "customer-1", name: "Acme" },
              ownerId: "user-1",
              owner: { id: "user-1", displayName: "销售" },
              stage: "CLOSED_WON",
              resultStatus: "WON",
              expectedAmount: 320000,
              expectedCloseDate: "2026-04-30T10:00:00.000Z",
              nextAction: "推进回款",
              stageHistory: [],
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-02T10:00:00.000Z"
            }
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
          sortBy: "updatedAt",
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
          customer: { id: "customer-1", name: "Acme" },
          ownerId: "user-1",
          owner: { id: "user-1", displayName: "销售" },
          stage: "CLOSED_WON",
          resultStatus: "WON",
          expectedAmount: 320000,
          expectedCloseDate: "2026-04-30T10:00:00.000Z",
          nextAction: "推进回款",
          stageHistory: [],
          createdAt: "2026-04-01T10:00:00.000Z",
          updatedAt: "2026-04-02T10:00:00.000Z"
        }
      });
    }

    if (url === "/revenue-operations/opportunities/opportunity-1") {
      return Promise.resolve({
        data: {
          opportunityId: "opportunity-1",
          customerId: "customer-1",
          quotes: [],
          contracts: [],
          paymentPlans: [],
          paymentRecords: [],
          renewalReminders: []
        }
      });
    }

    return Promise.resolve({ data: [] });
  });
}

describe("RevenueOperationsPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    replaceMock.mockReset();
    mockCustomers();
    postMock.mockResolvedValue({ data: { id: "record-1" } });
  });

  function mountPage() {
    return shallowMount(RevenueOperationsPage, {
      global: {
        stubs: {
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-input-number": true,
          "el-drawer": true,
          "el-select": true,
          "el-option": true,
          "el-button": true,
          "el-tag": true,
          "el-tabs": true,
          "el-tab-pane": true,
          "el-alert": true,
          "el-table": true,
          "el-table-column": true,
          "el-dialog": true,
          "el-date-picker": true,
          "el-empty": true
        }
      }
    });
  }

  it("loads context data from route query", async () => {
    const wrapper = mountPage();
    await flushPromises();

    expect(getMock).toHaveBeenCalledWith("/revenue-operations/customers/customer-1");
    expect(getMock).toHaveBeenCalledWith("/revenue-operations/opportunities/opportunity-1");
  });

  it("submits payment record linked to selected plan", async () => {
    const wrapper = mountPage();
    await flushPromises();

    (wrapper.vm as any).paymentRecordForm.paymentPlanId = "plan-1";
    (wrapper.vm as any).paymentRecordForm.amount = 80000;
    (wrapper.vm as any).paymentRecordForm.receivedAt = "2026-04-22T11:30:00.000Z";
    (wrapper.vm as any).paymentRecordForm.note = "客户支付首笔预付款";

    await (wrapper.vm as any).submitPaymentRecord();

    expect(postMock).toHaveBeenCalledWith("/revenue-operations/payment-records", {
      paymentPlanId: "plan-1",
      amount: 80000,
      receivedAt: "2026-04-22T11:30:00.000Z",
      note: "客户支付首笔预付款"
    });
  });
});
