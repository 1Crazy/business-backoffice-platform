/** OA 工作台 composable：负责工作台摘要数据的请求编排与状态维护。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

import { fetchActiveWorkflowTemplates, fetchMyWorkflowInstances, fetchPendingWorkflowTasks } from "@/api/workflow.api";
import { fetchWorkspaceOverview } from "@/api/workspace.api";
import { getWorkflowTemplateDefinition, WORKFLOW_TEMPLATE_KEY_ORDER, type WorkflowTemplateDefinition } from "@/config/workflow-templates";
import type { WorkspaceOverview } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

const EMPTY_OVERVIEW: WorkspaceOverview = {
  pendingApprovalCount: 0,
  myRequestCount: 0,
  administrativeRequestPendingCount: 0,
  administrativeRequestMyCount: 0,
  activeAnnouncementCount: 0,
  directoryDepartmentCount: 0,
  recentAnnouncements: []
};

export function useWorkspacePage() {
  const overview = ref<WorkspaceOverview>(EMPTY_OVERVIEW);
  const templateCards = ref<WorkflowTemplateDefinition[]>([]);
  const isLoading = ref(true);

  async function loadData(): Promise<void> {
    isLoading.value = true;

    try {
      const [workspaceOverview, activeTemplates, pendingTasks, myInstances] = await Promise.all([
        fetchWorkspaceOverview(),
        fetchActiveWorkflowTemplates(),
        fetchPendingWorkflowTasks(),
        fetchMyWorkflowInstances()
      ]);
      const activeTemplateKeys = activeTemplates
        .map((item) => item.key)
        .filter((item): item is (typeof WORKFLOW_TEMPLATE_KEY_ORDER)[number] =>
          WORKFLOW_TEMPLATE_KEY_ORDER.includes(item as (typeof WORKFLOW_TEMPLATE_KEY_ORDER)[number])
        );

      templateCards.value = activeTemplateKeys
        .sort((left, right) => WORKFLOW_TEMPLATE_KEY_ORDER.indexOf(left) - WORKFLOW_TEMPLATE_KEY_ORDER.indexOf(right))
        .map((key) => getWorkflowTemplateDefinition(key));
      overview.value = {
        ...workspaceOverview,
        pendingApprovalCount: pendingTasks.length,
        myRequestCount: myInstances.length,
        administrativeRequestPendingCount: pendingTasks.filter((item) => item.template.key !== "LEAVE").length,
        administrativeRequestMyCount: myInstances.filter((item) => item.template.key !== "LEAVE").length
      };
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "OA 工作台数据加载失败，请稍后重试。"));
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
    templateCards,
    overview
  };
}
