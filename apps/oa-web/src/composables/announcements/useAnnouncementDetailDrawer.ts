/** 公告详情抽屉 composable：负责同步路由 query、公告详情请求和抽屉开关状态。 */
import { ElMessage } from "element-plus";
import { computed, ref, watch } from "vue";
import type { LocationQueryRaw, LocationQueryValue } from "vue-router";
import { useRoute, useRouter } from "vue-router";

import { fetchAnnouncementDetail } from "@/api/announcements.api";
import { useViewport } from "@/composables/useViewport";
import type { AnnouncementDetail } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

const ANNOUNCEMENT_QUERY_KEY = "announcementId";

function normalizeAnnouncementId(queryValue: LocationQueryValue | LocationQueryValue[] | null | undefined): string | null {
  const normalizedValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;

  if (typeof normalizedValue !== "string") {
    return null;
  }

  const trimmedValue = normalizedValue.trim();
  return trimmedValue ? trimmedValue : null;
}

export function useAnnouncementDetailDrawer() {
  const route = useRoute();
  const router = useRouter();
  const { isTabletOrDown } = useViewport();

  const announcement = ref<AnnouncementDetail | null>(null);
  const isLoading = ref(false);
  const activeAnnouncementId = computed(() => normalizeAnnouncementId(route.query[ANNOUNCEMENT_QUERY_KEY]));
  const drawerVisible = computed({
    get: () => Boolean(activeAnnouncementId.value),
    set: (value: boolean) => {
      if (!value) {
        void closeAnnouncementDetail();
      }
    }
  });

  let latestRequestId = 0;

  async function syncAnnouncementDetail(announcementId: string | null): Promise<void> {
    if (!announcementId) {
      latestRequestId += 1;
      isLoading.value = false;
      announcement.value = null;
      return;
    }

    const currentRequestId = latestRequestId + 1;
    latestRequestId = currentRequestId;
    isLoading.value = true;

    try {
      const detail = await fetchAnnouncementDetail(announcementId);

      if (currentRequestId !== latestRequestId) {
        return;
      }

      announcement.value = detail;
    } catch (error) {
      if (currentRequestId !== latestRequestId) {
        return;
      }

      announcement.value = null;
      ElMessage.error(getRequestErrorMessage(error, "公告详情加载失败，请稍后重试。"));
    } finally {
      if (currentRequestId === latestRequestId) {
        isLoading.value = false;
      }
    }
  }

  async function updateAnnouncementQuery(announcementId: string | null): Promise<void> {
    const nextQuery: LocationQueryRaw = { ...route.query };

    if (announcementId) {
      nextQuery[ANNOUNCEMENT_QUERY_KEY] = announcementId;
    } else {
      delete nextQuery[ANNOUNCEMENT_QUERY_KEY];
    }

    await router.replace({
      query: nextQuery
    });
  }

  async function openAnnouncementDetail(announcementId: string): Promise<void> {
    if (activeAnnouncementId.value === announcementId) {
      if (!announcement.value && !isLoading.value) {
        await syncAnnouncementDetail(announcementId);
      }

      return;
    }

    await updateAnnouncementQuery(announcementId);
  }

  async function closeAnnouncementDetail(): Promise<void> {
    if (!activeAnnouncementId.value) {
      return;
    }

    await updateAnnouncementQuery(null);
  }

  watch(
    activeAnnouncementId,
    (announcementId) => {
      void syncAnnouncementDetail(announcementId);
    },
    {
      immediate: true
    }
  );

  return {
    announcement,
    isLoading,
    isTabletOrDown,
    drawerVisible,
    openAnnouncementDetail,
    closeAnnouncementDetail
  };
}
