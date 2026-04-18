/** 我的申请 composable：负责加载当前员工发起的请假申请记录。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

import { fetchMyAdministrativeRequests, fetchMyLeaveRequests } from "@/api/approvals.api";
import { resolveWorkflowTemplateKeyByAdministrativeType } from "@/config/workflow-templates";
import type { WorkflowRequestSummaryItem } from "@/types/office-automation";
import { formatLeaveType } from "@/utils/display";
import { getRequestErrorMessage } from "@/utils/request";

export function useMyRequestsPage() {
  const requests = ref<WorkflowRequestSummaryItem[]>([]);
  const isLoading = ref(true);

  async function loadData(): Promise<void> {
    isLoading.value = true;

    try {
      const [leaveRequests, administrativeRequests] = await Promise.all([
        fetchMyLeaveRequests(),
        fetchMyAdministrativeRequests()
      ]);

      requests.value = [
        ...leaveRequests.map((item) => ({
          id: item.id,
          requestCategory: "LEAVE" as const,
          templateKey: "LEAVE" as const,
          requestNo: null,
          title: formatLeaveType(item.leaveType),
          summary: item.reason,
          submittedAt: item.createdAt,
          status: item.status,
          currentHandlerName: item.currentApproverName ?? null,
          latestComment: item.latestComment ?? null
        })),
        ...administrativeRequests.map((item) => ({
          id: item.id,
          requestCategory: "ADMINISTRATIVE" as const,
          templateKey: resolveWorkflowTemplateKeyByAdministrativeType(item.type),
          requestNo: item.requestNo,
          title: item.title,
          summary: item.summary || item.reason,
          submittedAt: item.submittedAt,
          status: item.status,
          currentHandlerName: item.approverName ?? null,
          latestComment: item.latestComment ?? null
        }))
      ].sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "我的申请加载失败，请稍后重试。"));
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    isLoading,
    loadData,
    requests
  };
}
