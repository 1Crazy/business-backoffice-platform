import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mount } from "@vue/test-utils";

import DashboardPage from "./DashboardPage.vue";

vi.mock("@/composables/dashboard/useDashboardOverview", () => ({
  useDashboardOverview: () => ({
    cards: ref([
      {
        label: "新增客户",
        value: 128,
        caption: "统计周期内新增的客户档案数"
      },
      {
        label: "跟进次数",
        value: 412,
        caption: "统计周期内新建的跟进记录数"
      },
      {
        label: "新增商机",
        value: 36,
        caption: "按创建时间进入销售管道的新商机数量"
      },
      {
        label: "进行中预计金额",
        value: "¥256,800.00",
        caption: "按预计成交时间统计的进行中商机金额"
      },
      {
        label: "商机赢单率",
        value: "57.14%",
        caption: "同周期赢单数 / 赢单数与输单数之和"
      },
      {
        label: "线索转化率",
        value: "23.7%",
        caption: "已转客户线索 / 周期内线索总数"
      }
    ]),
    dateRange: ref([]),
    isOverviewEmpty: ref(false),
    loadOverview: vi.fn(),
    overview: ref({
      startDate: "2026-03-08",
      endDate: "2026-04-06",
      newCustomers: 128,
      followUpCount: 412,
      convertedLeads: 37,
      totalLeads: 156,
      conversionRate: 23.7,
      pendingReminders: 19,
      newOpportunities: 36,
      pipelineForecastAmount: 256800,
      wonOpportunities: 12,
      wonAmount: 182000,
      opportunityWinRate: 57.14
    })
  })
}));

describe("DashboardPage", () => {
  it("renders the upgraded dashboard sections and KPI content", () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          "el-date-picker": true
        }
      }
    });

    expect(wrapper.text()).toContain("销售运营");
    expect(wrapper.text()).toContain("新增客户");
    expect(wrapper.text()).toContain("128");
    expect(wrapper.text()).toContain("新增商机");
    expect(wrapper.text()).toContain("36");
    expect(wrapper.text()).toContain("数据解读");
    expect(wrapper.text()).toContain("赢单金额");
  });
});
