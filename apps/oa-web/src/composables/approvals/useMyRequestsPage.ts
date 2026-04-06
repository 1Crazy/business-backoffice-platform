/** 我的申请 composable：负责加载当前员工发起的请假申请记录。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

import { fetchMyLeaveRequests } from "@/api/approvals.api";
import type { LeaveRequestItem } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

export function useMyRequestsPage() {
  const requests = ref<LeaveRequestItem[]>([]);

  async function loadData(): Promise<void> {
    try {
      requests.value = await fetchMyLeaveRequests();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "我的申请加载失败，请稍后重试。"));
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    loadData,
    requests
  };
}
