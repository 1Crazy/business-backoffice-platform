/** 待我审批 composable：负责审批列表加载与审批动作编排。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

import { decideLeaveRequest, fetchPendingApprovals } from "@/api/approvals.api";
import type { ApprovalDecision, PendingApprovalItem } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

export function useApprovalsInboxPage() {
  const approvals = ref<PendingApprovalItem[]>([]);
  const processingId = ref<string | null>(null);

  async function loadData(): Promise<void> {
    try {
      approvals.value = await fetchPendingApprovals();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "待审批列表加载失败，请稍后重试。"));
    }
  }

  async function decide(requestId: string, decision: ApprovalDecision): Promise<void> {
    const comment = window.prompt(decision === "APPROVED" ? "填写通过意见（可留空）" : "填写驳回意见（可留空）") ?? "";

    try {
      processingId.value = requestId;
      await decideLeaveRequest(requestId, {
        decision,
        comment: comment.trim() || undefined
      });
      ElMessage.success(decision === "APPROVED" ? "审批已通过。" : "申请已驳回。");
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
    decide,
    loadData,
    processingId
  };
}
