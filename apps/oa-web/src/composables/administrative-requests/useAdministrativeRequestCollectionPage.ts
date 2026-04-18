/** 行政申请列表 composable：负责筛选、列表加载与审批动作编排。 */
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref, watch } from "vue";

import {
  cancelAdministrativeRequest,
  decideAdministrativeRequest,
  fetchMyAdministrativeRequests,
  fetchPendingAdministrativeApprovals
} from "@/api/approvals.api";
import type {
  AdministrativeRequestItem,
  AdministrativeRequestStatus,
  AdministrativeRequestType,
  ApprovalDecision,
  ListAdministrativeRequestQuery
} from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

type AdministrativeRequestListMode = "mine" | "pending";

interface AdministrativeRequestFilters {
  type: AdministrativeRequestType | "";
  status: AdministrativeRequestStatus | "";
}

export function useAdministrativeRequestCollectionPage(mode: AdministrativeRequestListMode) {
  const requests = ref<AdministrativeRequestItem[]>([]);
  const isLoading = ref(true);
  const processingId = ref<string | null>(null);
  const decisionDialogVisible = ref(false);
  const currentRequest = ref<AdministrativeRequestItem | null>(null);
  const pendingDecision = ref<ApprovalDecision | null>(null);
  const decisionComment = ref("");
  let skipNextFilterReload = false;

  const filters = reactive<AdministrativeRequestFilters>({
    type: "",
    status: ""
  });

  const canDecide = computed(() => mode === "pending");
  const canCancel = computed(() => mode === "mine");
  const decisionSubmitting = computed(
    () => currentRequest.value !== null && processingId.value === currentRequest.value.id
  );

  function buildListQuery(): ListAdministrativeRequestQuery {
    return {
      type: filters.type || undefined,
      status: filters.status || undefined
    };
  }

  async function loadData(): Promise<void> {
    isLoading.value = true;

    try {
      const query = buildListQuery();

      requests.value =
        mode === "mine"
          ? await fetchMyAdministrativeRequests(query)
          : await fetchPendingAdministrativeApprovals(query);
    } catch (error) {
      ElMessage.error(
        getRequestErrorMessage(
          error,
          mode === "mine" ? "行政申请列表加载失败，请稍后重试。" : "行政审批列表加载失败，请稍后重试。"
        )
      );
    } finally {
      isLoading.value = false;
    }
  }

  function resetDecisionDialog(): void {
    decisionDialogVisible.value = false;
    currentRequest.value = null;
    pendingDecision.value = null;
    decisionComment.value = "";
  }

  function resetFilters(): void {
    if (!filters.type && !filters.status) {
      return;
    }

    // 重置由显式查询兜底，跳过紧随其后的筛选 watch，避免一次重置打出两次请求。
    skipNextFilterReload = true;
    filters.type = "";
    filters.status = "";
    void loadData();
  }

  function openDecisionDialog(request: AdministrativeRequestItem, decision: ApprovalDecision): void {
    if (!canDecide.value) {
      return;
    }

    currentRequest.value = request;
    pendingDecision.value = decision;
    decisionComment.value = "";
    decisionDialogVisible.value = true;
  }

  function closeDecisionDialog(): void {
    if (decisionSubmitting.value) {
      return;
    }

    resetDecisionDialog();
  }

  async function submitDecision(): Promise<void> {
    if (!currentRequest.value || !pendingDecision.value || !canDecide.value) {
      return;
    }

    try {
      processingId.value = currentRequest.value.id;
      const targetRequestId = currentRequest.value.workflowTaskId ?? currentRequest.value.id;
      await decideAdministrativeRequest(targetRequestId, {
        decision: pendingDecision.value,
        comment: decisionComment.value.trim() || undefined
      });
      ElMessage.success(pendingDecision.value === "APPROVED" ? "行政审批已通过。" : "行政申请已驳回。");
      resetDecisionDialog();
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "行政审批动作提交失败，请稍后重试。"));
    } finally {
      processingId.value = null;
    }
  }

  async function cancelRequest(request: AdministrativeRequestItem): Promise<void> {
    if (!canCancel.value) {
      return;
    }

    try {
      processingId.value = request.id;
      await cancelAdministrativeRequest(request.id);
      ElMessage.success("行政申请已撤回。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "撤回行政申请失败，请稍后重试。"));
    } finally {
      processingId.value = null;
    }
  }

  watch(
    () => [filters.type, filters.status],
    () => {
      if (skipNextFilterReload) {
        skipNextFilterReload = false;
        return;
      }

      void loadData();
    }
  );

  onMounted(() => {
    void loadData();
  });

  return {
    canCancel,
    canDecide,
    cancelRequest,
    closeDecisionDialog,
    currentRequest,
    decisionComment,
    decisionDialogVisible,
    decisionSubmitting,
    filters,
    isLoading,
    loadData,
    openDecisionDialog,
    pendingDecision,
    processingId,
    requests,
    resetFilters,
    submitDecision
  };
}
