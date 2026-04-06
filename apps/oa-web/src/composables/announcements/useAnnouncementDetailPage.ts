/** 公告详情 composable：负责根据路由参数加载公告详情。 */
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { fetchAnnouncementDetail } from "@/api/announcements.api";
import type { AnnouncementDetail } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

export function useAnnouncementDetailPage() {
  const route = useRoute();
  const announcement = ref<AnnouncementDetail | null>(null);

  async function loadData(): Promise<void> {
    const announcementId = route.params.id?.toString();

    if (!announcementId) {
      announcement.value = null;
      return;
    }

    try {
      announcement.value = await fetchAnnouncementDetail(announcementId);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "公告详情加载失败，请稍后重试。"));
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    announcement,
    loadData
  };
}
