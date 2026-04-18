import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mount } from "@vue/test-utils";

import MyRequestsPage from "./MyRequestsPage.vue";

vi.mock("@/composables/approvals/useMyRequestsPage", () => ({
  useMyRequestsPage: () => ({
    isLoading: ref(false),
    requests: ref([
      {
        id: "leave-1",
        requestCategory: "LEAVE",
        templateKey: "LEAVE",
        requestNo: null,
        title: "年假",
        summary: "4 月 12 日请假一天",
        submittedAt: "2026-04-11 09:00",
        status: "PENDING",
        currentHandlerName: "张主管",
        latestComment: null
      },
      {
        id: "admin-1",
        requestCategory: "ADMINISTRATIVE",
        templateKey: "REIMBURSEMENT",
        requestNo: "BX20260412001",
        title: "差旅报销",
        summary: "上海出差交通与住宿费用",
        submittedAt: "2026-04-10 13:20",
        status: "APPROVED",
        currentHandlerName: "财务共享中心",
        latestComment: "已通过"
      }
    ])
  })
}));

describe("MyRequestsPage", () => {
  it("renders unified workflow requests from leave and administrative templates", () => {
    const wrapper = mount(MyRequestsPage, {
      global: {
        stubs: {
          "el-empty": true
        }
      }
    });

    expect(wrapper.text()).toContain("我发起的申请");
    expect(wrapper.text()).toContain("请假申请");
    expect(wrapper.text()).toContain("报销申请");
    expect(wrapper.text()).toContain("年假");
    expect(wrapper.text()).toContain("差旅报销");
    expect(wrapper.text()).toContain("BX20260412001");
  });
});
