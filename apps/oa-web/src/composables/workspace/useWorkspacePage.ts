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

function normalizeOverview(value: WorkspaceOverview): WorkspaceOverview {
  return {
    ...EMPTY_OVERVIEW,
    ...value,
    recentAnnouncements: Array.isArray(value.recentAnnouncements) ? value.recentAnnouncements : []
  };
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }

  return [];
}

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
      const normalizedActiveTemplates = normalizeArray<WorkflowTemplateDefinition>(activeTemplates);
      const normalizedPendingTasks = normalizeArray<{ template?: { key?: string } }>(pendingTasks);
      const normalizedMyInstances = normalizeArray<{ template?: { key?: string } }>(myInstances);

      const activeTemplateKeys = normalizedActiveTemplates
        .map((item) => item.key)
        .filter((item): item is (typeof WORKFLOW_TEMPLATE_KEY_ORDER)[number] =>
          WORKFLOW_TEMPLATE_KEY_ORDER.includes(item as (typeof WORKFLOW_TEMPLATE_KEY_ORDER)[number])
        );

      templateCards.value = activeTemplateKeys
        .sort((left, right) => WORKFLOW_TEMPLATE_KEY_ORDER.indexOf(left) - WORKFLOW_TEMPLATE_KEY_ORDER.indexOf(right))
        .map((key) => getWorkflowTemplateDefinition(key));
      overview.value = normalizeOverview({
        ...workspaceOverview,
        pendingApprovalCount: normalizedPendingTasks.length,
        myRequestCount: normalizedMyInstances.length,
        administrativeRequestPendingCount: normalizedPendingTasks.filter((item) => item.template?.key !== "LEAVE").length,
        administrativeRequestMyCount: normalizedMyInstances.filter((item) => item.template?.key !== "LEAVE").length
      });
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
