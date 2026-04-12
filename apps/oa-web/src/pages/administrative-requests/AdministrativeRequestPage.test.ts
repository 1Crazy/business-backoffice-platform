import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import AdministrativeRequestPage from "./AdministrativeRequestPage.vue";

const openAdministrativeRequestDetail = vi.fn();

vi.mock("@/composables/administrative-requests/useAdministrativeRequestPage", () => ({
  useAdministrativeRequestPage: () => ({
    form: ref({
      type: "REIMBURSEMENT",
      title: "",
      reason: "",
      attachmentNames: []
    }).value,
    handleTypeChange: vi.fn(),
    isRecentLoading: ref(false),
    recentRequests: ref([
      {
        id: "req-1",
        requestNo: "BX-20260411-100001",
        type: "REIMBURSEMENT",
        title: "华东客户拜访报销",
        summary: "差旅交通 / Alice / 1280.00",
        reason: "补充客户拜访期间的交通与住宿费用。",
        status: "PENDING",
        attachmentNames: ["invoice.pdf"],
        approverName: "Bob",
        submittedAt: "2026-04-11 10:00:00"
      }
    ]),
    requestTypes: ["REIMBURSEMENT", "TRAVEL", "PURCHASE", "SEAL"],
    rules: {},
    setFormRef: vi.fn(),
    submit: vi.fn(),
    submitting: ref(false)
  })
}));

vi.mock("@/composables/administrative-requests/useAdministrativeRequestDetailDrawer", () => ({
  useAdministrativeRequestDetailDrawer: () => ({
    drawerVisible: ref(false),
    isLoading: ref(false),
    isTabletOrDown: ref(false),
    openAdministrativeRequestDetail,
    request: ref(null)
  })
}));

describe("AdministrativeRequestPage", () => {
  it("renders four request types and recent administrative requests", async () => {
    openAdministrativeRequestDetail.mockClear();

    const wrapper = mount(AdministrativeRequestPage, {
      global: {
        stubs: {
          AdministrativeRequestDetailDrawer: true,
          RouterLink: RouterLinkStub,
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-input-number": true,
          "el-button": true,
          "el-select": true,
          "el-date-picker": true,
          "el-empty": true
        }
      }
    });

    expect(wrapper.text()).toContain("发起行政申请");
    expect(wrapper.text()).toContain("报销申请");
    expect(wrapper.text()).toContain("出差申请");
    expect(wrapper.text()).toContain("采购申请");
    expect(wrapper.text()).toContain("用印申请");
    expect(wrapper.text()).toContain("华东客户拜访报销");

    await wrapper.get("el-button-stub").trigger("click");

    expect(openAdministrativeRequestDetail).toHaveBeenCalledWith("req-1");
  });
});
