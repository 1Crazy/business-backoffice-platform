/** 待我审批 composable：负责审批列表加载与审批动作编排。 */
import { ElMessage } from "element-plus";
import { computed, onMounted, ref } from "vue";

import { decideLeaveRequest, fetchPendingApprovals } from "@/api/approvals.api";
import type { ApprovalDecision, PendingApprovalItem } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

export function useApprovalsInboxPage() {
  const approvals = ref<PendingApprovalItem[]>([]);
  const processingId = ref<string | null>(null);
  const decisionDialogVisible = ref(false);
  const currentApproval = ref<PendingApprovalItem | null>(null);
  const pendingDecision = ref<ApprovalDecision | null>(null);
  const decisionComment = ref("");
  const decisionSubmitting = computed(
    () => currentApproval.value !== null && processingId.value === currentApproval.value.id
  );

  function resetDecisionDialog(): void {
    decisionDialogVisible.value = false;
    currentApproval.value = null;
    pendingDecision.value = null;
    decisionComment.value = "";
  }

  async function loadData(): Promise<void> {
    try {
      approvals.value = await fetchPendingApprovals();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "待审批列表加载失败，请稍后重试。"));
    }
  }

  function openDecisionDialog(approval: PendingApprovalItem, decision: ApprovalDecision): void {
    currentApproval.value = approval;
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
    if (!currentApproval.value || !pendingDecision.value) {
      return;
    }

    try {
      processingId.value = currentApproval.value.id;
      await decideLeaveRequest(currentApproval.value.id, {
        decision: pendingDecision.value,
        comment: decisionComment.value.trim() || undefined
      });
      ElMessage.success(pendingDecision.value === "APPROVED" ? "审批已通过。" : "申请已驳回。");
      resetDecisionDialog();
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "审批动作提交失败，请稍后重试。"));
    } finally {
      processingId.value = null;
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    approvals,
    closeDecisionDialog,
    currentApproval,
    decisionComment,
    decisionDialogVisible,
    decisionSubmitting,
    loadData,
    openDecisionDialog,
    pendingDecision,
    processingId,
    submitDecision
  };
}
