/** 公告列表 composable：负责公告列表请求编排与状态维护。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

import { fetchAnnouncements } from "@/api/announcements.api";
import type { AnnouncementSummary } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

export function useAnnouncementsPage() {
  const announcements = ref<AnnouncementSummary[]>([]);

  async function loadData(): Promise<void> {
    try {
      announcements.value = await fetchAnnouncements();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "公告列表加载失败，请稍后重试。"));
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    announcements,
    loadData
  };
}
