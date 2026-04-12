import { mount } from "@vue/test-utils";

import OpportunityDetailDrawer from "./OpportunityDetailDrawer.vue";

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn()
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

describe("OpportunityDetailDrawer", () => {
  it("renders revenue operation summaries inside the opportunity detail drawer", () => {
    const wrapper = mount(OpportunityDetailDrawer, {
      props: {
        visible: true,
        isTabletOrDown: false,
        opportunity: {
          id: "opportunity-1",
          name: "Acme 年度框架合作",
          customerId: "customer-1",
          customer: {
            id: "customer-1",
            name: "Acme 科技"
          },
          ownerId: "user-1",
          owner: {
            id: "user-1",
            username: "admin",
            displayName: "系统管理员",
            email: null,
            phone: null,
            status: "ACTIVE",
            departmentId: "dept-1",
            roles: []
          },
          stage: "CLOSED_WON",
          resultStatus: "WON",
          expectedAmount: 320000,
          expectedCloseDate: "2026-04-30T10:00:00.000Z",
          nextAction: "推进年度交付与回款节点执行",
          notes: "已赢单，进入合同履约与回款阶段。",
          closedAt: "2026-04-12T15:00:00.000Z",
          lostReason: null,
          stageHistory: [],
          quotes: [
            {
              id: "quote-1",
              quoteNo: "Q-202604-ACME-001",
              title: "Acme 年度解决方案报价",
              amount: 320000,
              status: "ACCEPTED",
              issuedAt: "2026-04-06T10:00:00.000Z",
              expiresAt: "2026-04-20T23:59:59.000Z"
            }
          ],
          contracts: [
            {
              id: "contract-1",
              contractNo: "C-202604-ACME-001",
              title: "Acme 年度框架合同",
              amount: 320000,
              status: "ACTIVE",
              startDate: "2026-04-15T00:00:00.000Z",
              endDate: "2027-04-14T23:59:59.000Z",
              signedAt: "2026-04-14T16:00:00.000Z"
            }
          ],
          paymentPlans: [
            {
              id: "plan-1",
              title: "首期预付款",
              plannedAmount: 160000,
              receivedAmount: 80000,
              status: "PARTIAL",
              plannedDate: "2026-04-20T00:00:00.000Z"
            }
          ],
          paymentRecords: [
            {
              id: "record-1",
              amount: 80000,
              receivedAt: "2026-04-22T11:30:00.000Z",
              note: "客户已支付首笔预付款。"
            }
          ],
          renewalReminders: [
            {
              id: "renewal-1",
              title: "Acme 年度框架合同续费跟进",
              remindAt: "2027-02-15T09:00:00.000Z",
              status: "PENDING",
              note: "提前两个月启动续费评估。"
            }
          ],
          createdAt: "2026-04-05T10:00:00.000Z",
          updatedAt: "2026-04-06T10:00:00.000Z"
        }
      },
      global: {
        stubs: {
          "el-drawer": {
            props: ["modelValue", "title"],
            template: "<div><h2>{{ title }}</h2><slot /></div>"
          },
          "el-tag": {
            template: "<span><slot /></span>"
          },
          "el-descriptions": {
            template: "<div><slot /></div>"
          },
          "el-descriptions-item": {
            props: ["label"],
            template: "<div>{{ label }}<slot /></div>"
          },
          "el-empty": {
            props: ["description"],
            template: "<div>{{ description }}</div>"
          },
          "el-button": {
            template: "<button><slot /></button>"
          },
          "el-timeline": {
            template: "<div><slot /></div>"
          },
          "el-timeline-item": {
            props: ["timestamp"],
            template: "<div>{{ timestamp }}<slot /></div>"
          }
        }
      }
    });

    expect(wrapper.text()).toContain("成交后经营");
    expect(wrapper.text()).toContain("Q-202604-ACME-001");
    expect(wrapper.text()).toContain("Acme 年度框架合同");
    expect(wrapper.text()).toContain("首期预付款");
    expect(wrapper.text()).toContain("客户已支付首笔预付款。");
    expect(wrapper.text()).toContain("Acme 年度框架合同续费跟进");
  });
});
