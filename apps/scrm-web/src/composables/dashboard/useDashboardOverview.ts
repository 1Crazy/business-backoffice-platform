/** 场景 composable：负责页面状态、请求编排和错误反馈策略的复用。 */
import { ElMessage } from "element-plus";
import { computed, onMounted, ref } from "vue";

import { fetchDashboardOverview } from "@/api/dashboard.api";
import type {
  DashboardDateRange,
  DashboardDepartmentFilterOption,
  DashboardOverview,
  DashboardOwnerFilterOption
} from "@/types/dashboard";
import { formatAmount } from "@/utils/display";
import { getRequestErrorMessage } from "@/utils/request";

export function useDashboardOverview() {
  const dateRange = ref<DashboardDateRange>([]);
  const selectedDepartmentId = ref<string>();
  const selectedOwnerId = ref<string>();
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
        overview.value?.wonAmount ?? 0,
        overview.value?.receivableForecast.plannedAmount ?? 0,
        overview.value?.receivableForecast.receivedAmount ?? 0
      ].every((value) => value === 0)
  );

  const departmentOptions = computed<DashboardDepartmentFilterOption[]>(() => overview.value?.departments ?? []);
  const ownerOptions = computed<DashboardOwnerFilterOption[]>(() => overview.value?.owners ?? []);
  const salesFunnel = computed(() => overview.value?.salesFunnel ?? []);
  const ownerPerformanceRanking = computed(() => overview.value?.ownerPerformanceRanking ?? []);
  const departmentPerformanceRanking = computed(() => overview.value?.departmentPerformanceRanking ?? []);
  const receivableForecast = computed(() => overview.value?.receivableForecast ?? null);
  const approvalTimeliness = computed(() => overview.value?.approvalTimeliness ?? null);
  const selectedDepartmentName = computed(
    () => departmentOptions.value.find((item) => item.id === selectedDepartmentId.value)?.name ?? "全部团队"
  );
  const selectedOwnerName = computed(
    () => ownerOptions.value.find((item) => item.id === selectedOwnerId.value)?.displayName ?? "全部负责人"
  );

  const cards = computed(() => [
    {
      label: "新增客户",
      value: overview.value?.newCustomers ?? "--",
      caption: "本期新增客户"
    },
    {
      label: "跟进次数",
      value: overview.value?.followUpCount ?? "--",
      caption: "本期新增跟进"
    },
    {
      label: "新增商机",
      value: overview.value?.newOpportunities ?? "--",
      caption: "本期新增商机"
    },
    {
      label: "计划回款",
      value: receivableForecast.value ? formatAmount(receivableForecast.value.plannedAmount) : "--",
      caption: "统计周期内计划回款金额"
    },
    {
      label: "已回款",
      value: receivableForecast.value ? formatAmount(receivableForecast.value.receivedAmount) : "--",
      caption: "统计周期内已落账回款"
    },
    {
      label: "商机赢单率",
      value: overview.value ? `${overview.value.opportunityWinRate}%` : "--",
      caption: "本期赢单率"
    },
    {
      label: "平均审批时效",
      value: approvalTimeliness.value ? `${approvalTimeliness.value.averageHours}h` : "--",
      caption: "OA 审批完成平均耗时"
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
      const result = await fetchDashboardOverview({
        startDate,
        endDate,
        departmentId: selectedDepartmentId.value,
        ownerId: selectedOwnerId.value
      });
      overview.value = result;
      selectedDepartmentId.value = result.departmentId ?? undefined;
      selectedOwnerId.value = result.ownerId ?? undefined;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "看板数据加载失败，请检查后端服务后重试。"));
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  }

  async function resetOverviewFilters(): Promise<void> {
    const isAlreadyDefault =
      dateRange.value.length === 0 && !selectedDepartmentId.value && !selectedOwnerId.value;

    dateRange.value = [];
    selectedDepartmentId.value = undefined;
    selectedOwnerId.value = undefined;

    if (isAlreadyDefault) {
      await loadOverview();
      return;
    }

    await loadOverview();
  }

  onMounted(() => {
    void loadOverview();
  });

  return {
    approvalTimeliness,
    cards,
    dateRange,
    departmentOptions,
    departmentPerformanceRanking,
    isLoading,
    isOverviewEmpty,
    isRefreshing,
    loadOverview,
    ownerOptions,
    ownerPerformanceRanking,
    overview,
    receivableForecast,
    resetOverviewFilters,
    salesFunnel,
    selectedDepartmentId,
    selectedDepartmentName,
    selectedOwnerId,
    selectedOwnerName
  };
}
