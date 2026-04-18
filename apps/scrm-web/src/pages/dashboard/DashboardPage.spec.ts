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
    departmentOptions: ref([
      { id: "dept-1", name: "华东团队" },
      { id: "dept-2", name: "华南团队" }
    ]),
    ownerOptions: ref([
      { id: "user-1", displayName: "Alice", departmentId: "dept-1", departmentName: "华东团队" }
    ]),
    salesFunnel: ref([
      { key: "LEADS", label: "线索池", count: 156, amount: 0 },
      { key: "CLOSED_WON", label: "赢单", count: 12, amount: 182000 }
    ]),
    ownerPerformanceRanking: ref([
      {
        id: "user-1",
        label: "Alice",
        departmentName: "华东团队",
        wonAmount: 182000,
        receivedAmount: 156000,
        newCustomers: 18,
        wonOpportunities: 12
      }
    ]),
    departmentPerformanceRanking: ref([
      {
        id: "dept-1",
        label: "华东团队",
        departmentName: "华东团队",
        wonAmount: 182000,
        receivedAmount: 156000,
        newCustomers: 18,
        wonOpportunities: 12
      }
    ]),
    selectedDepartmentId: ref("dept-1"),
    selectedDepartmentName: ref("华东团队"),
    selectedOwnerId: ref("user-1"),
    selectedOwnerName: ref("Alice"),
    isOverviewEmpty: ref(false),
    loadOverview: vi.fn(),
    overview: ref({
      startDate: "2026-03-08",
      endDate: "2026-04-06",
      departmentId: "dept-1",
      ownerId: "user-1",
      departments: [
        { id: "dept-1", name: "华东团队" },
        { id: "dept-2", name: "华南团队" }
      ],
      owners: [
        { id: "user-1", displayName: "Alice", departmentId: "dept-1", departmentName: "华东团队" }
      ],
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
      opportunityWinRate: 57.14,
      salesFunnel: [
        { key: "LEADS", label: "线索池", count: 156, amount: 0 },
        { key: "CLOSED_WON", label: "赢单", count: 12, amount: 182000 }
      ],
      ownerPerformanceRanking: [
        {
          id: "user-1",
          label: "Alice",
          departmentName: "华东团队",
          wonAmount: 182000,
          receivedAmount: 156000,
          newCustomers: 18,
          wonOpportunities: 12
        }
      ],
      departmentPerformanceRanking: [
        {
          id: "dept-1",
          label: "华东团队",
          departmentName: "华东团队",
          wonAmount: 182000,
          receivedAmount: 156000,
          newCustomers: 18,
          wonOpportunities: 12
        }
      ],
      receivableForecast: {
        plannedAmount: 210000,
        receivedAmount: 156000,
        unreceivedAmount: 54000,
        overdueAmount: 12000
      },
      approvalTimeliness: {
        averageHours: 9.5,
        leaveAverageHours: 8,
        administrativeAverageHours: 11,
        completedCount: 16,
        pendingOver48Hours: 3
      }
    })
  })
}));

describe("DashboardPage", () => {
  it("renders the redesigned dashboard filter and sales overview", () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          "el-button": true,
          "el-date-picker": true,
          "el-form": true,
          "el-form-item": true,
          "el-select": true,
          "el-option": true
        }
      }
    });

    expect(wrapper.text()).toContain("运营看板");
    expect(wrapper.text()).toContain("看板筛选");
    expect(wrapper.text()).toContain("新增客户");
    expect(wrapper.text()).toContain("128");
    expect(wrapper.text()).toContain("新增商机");
    expect(wrapper.text()).toContain("36");
    expect(wrapper.text()).toContain("销售概览");
    expect(wrapper.text()).toContain("本期经营态势");
    expect(wrapper.text()).toContain("经营结果");
    expect(wrapper.text()).toContain("商机赢单率");
    expect(wrapper.text()).toContain("负责人排行");
    expect(wrapper.text()).toContain("团队排行");
    expect(wrapper.text()).toContain("平均审批时效");
  });
});
