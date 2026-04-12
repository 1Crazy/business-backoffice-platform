/** OA 工作台 composable：负责工作台摘要数据的请求编排与状态维护。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

import { fetchWorkspaceOverview } from "@/api/workspace.api";
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
  const isLoading = ref(true);

  async function loadData(): Promise<void> {
    isLoading.value = true;

    try {
      overview.value = await fetchWorkspaceOverview();
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
    overview
  };
}
