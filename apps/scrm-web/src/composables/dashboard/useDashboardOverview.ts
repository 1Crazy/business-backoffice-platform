/** 场景 composable：负责页面状态、请求编排和错误反馈策略的复用。 */
import { ElMessage } from "element-plus";
import { computed, onMounted, ref } from "vue";

import { fetchDashboardOverview } from "@/api/dashboard.api";
import type { DashboardDateRange, DashboardOverview } from "@/types/dashboard";
import { formatAmount } from "@/utils/display";
import { getRequestErrorMessage } from "@/utils/request";

export function useDashboardOverview() {
  const dateRange = ref<DashboardDateRange>([]);
  const overview = ref<DashboardOverview | null>(null);
  const isLoading = ref(true);
  const isRefreshing = ref(false);

  const isOverviewEmpty = computed(
    () =>
      Boolean(overview.value) &&
      [
        overview.value?.newCustomers ?? 0,
        overview.value?.followUpCount ?? 0,
        overview.value?.convertedLeads ?? 0,
        overview.value?.totalLeads ?? 0,
        overview.value?.pendingReminders ?? 0,
        overview.value?.newOpportunities ?? 0,
        overview.value?.pipelineForecastAmount ?? 0,
        overview.value?.wonOpportunities ?? 0,
        overview.value?.wonAmount ?? 0
      ].every((value) => value === 0)
  );

  const cards = computed(() => [
    {
      label: "新增客户",
      value: overview.value?.newCustomers ?? "--",
      caption: "统计周期内新增的客户档案数"
    },
    {
      label: "跟进次数",
      value: overview.value?.followUpCount ?? "--",
      caption: "统计周期内新建的跟进记录数"
    },
    {
      label: "新增商机",
      value: overview.value?.newOpportunities ?? "--",
      caption: "按创建时间进入销售管道的新商机数量"
    },
    {
      label: "进行中预计金额",
      value: overview.value ? formatAmount(overview.value.pipelineForecastAmount) : "--",
      caption: "按预计成交时间统计的进行中商机金额"
    },
    {
      label: "商机赢单率",
      value: overview.value ? `${overview.value.opportunityWinRate}%` : "--",
      caption: "同周期赢单数 / 赢单数与输单数之和"
    },
    {
      label: "线索转化率",
      value: overview.value ? `${overview.value.conversionRate}%` : "--",
      caption: "已转客户线索 / 周期内线索总数"
    }
  ]);

  async function loadOverview(): Promise<void> {
    const [startDate, endDate] = dateRange.value;
    const shouldShowSkeleton = !overview.value;

    if (shouldShowSkeleton) {
      isLoading.value = true;
    } else {
      isRefreshing.value = true;
    }

    try {
      overview.value = await fetchDashboardOverview({
        startDate,
        endDate
      });
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "看板数据加载失败，请检查后端服务后重试。"));
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  }

  onMounted(() => {
    void loadOverview();
  });

  return {
    cards,
    dateRange,
    isLoading,
    isOverviewEmpty,
    isRefreshing,
    loadOverview,
    overview
  };
}
