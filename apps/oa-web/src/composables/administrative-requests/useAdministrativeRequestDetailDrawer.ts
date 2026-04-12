/** 行政申请详情抽屉 composable：负责同步路由 query、详情加载与抽屉开关状态。 */
import { ElMessage } from "element-plus";
import { computed, ref, watch } from "vue";
import type { LocationQueryRaw, LocationQueryValue } from "vue-router";
import { useRoute, useRouter } from "vue-router";

import { fetchAdministrativeRequestDetail } from "@/api/approvals.api";
import { useViewport } from "@/composables/useViewport";
import type { AdministrativeRequestDetail } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

const ADMINISTRATIVE_REQUEST_QUERY_KEY = "administrativeRequestId";

function normalizeRequestId(queryValue: LocationQueryValue | LocationQueryValue[] | null | undefined): string | null {
  const normalizedValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;

  if (typeof normalizedValue !== "string") {
    return null;
  }

  const trimmedValue = normalizedValue.trim();
  return trimmedValue ? trimmedValue : null;
}

export function useAdministrativeRequestDetailDrawer() {
  const route = useRoute();
  const router = useRouter();
  const { isTabletOrDown } = useViewport();

  const request = ref<AdministrativeRequestDetail | null>(null);
  const isLoading = ref(false);
  const activeRequestId = computed(() => normalizeRequestId(route.query[ADMINISTRATIVE_REQUEST_QUERY_KEY]));
  const drawerVisible = computed({
    get: () => Boolean(activeRequestId.value),
    set: (value: boolean) => {
      if (!value) {
        void closeAdministrativeRequestDetail();
      }
    }
  });

  let latestRequestId = 0;

  async function syncAdministrativeRequestDetail(requestId: string | null): Promise<void> {
    if (!requestId) {
      latestRequestId += 1;
      isLoading.value = false;
      request.value = null;
      return;
    }

    const currentRequestId = latestRequestId + 1;
    latestRequestId = currentRequestId;
    isLoading.value = true;

    try {
      const detail = await fetchAdministrativeRequestDetail(requestId);

      if (currentRequestId !== latestRequestId) {
        return;
      }

      request.value = detail;
    } catch (error) {
      if (currentRequestId !== latestRequestId) {
        return;
      }

      request.value = null;
      ElMessage.error(getRequestErrorMessage(error, "行政申请详情加载失败，请稍后重试。"));
    } finally {
      if (currentRequestId === latestRequestId) {
        isLoading.value = false;
      }
    }
  }

  async function updateAdministrativeRequestQuery(requestId: string | null): Promise<void> {
    const nextQuery: LocationQueryRaw = { ...route.query };

    if (requestId) {
      nextQuery[ADMINISTRATIVE_REQUEST_QUERY_KEY] = requestId;
    } else {
      delete nextQuery[ADMINISTRATIVE_REQUEST_QUERY_KEY];
    }

    await router.replace({
      query: nextQuery
    });
  }

  async function openAdministrativeRequestDetail(requestId: string): Promise<void> {
    if (activeRequestId.value === requestId) {
      if (!request.value && !isLoading.value) {
        await syncAdministrativeRequestDetail(requestId);
      }

      return;
    }

    await updateAdministrativeRequestQuery(requestId);
  }

  async function closeAdministrativeRequestDetail(): Promise<void> {
    if (!activeRequestId.value) {
      return;
    }

    await updateAdministrativeRequestQuery(null);
  }

  watch(
    activeRequestId,
    (requestId) => {
      void syncAdministrativeRequestDetail(requestId);
    },
    {
      immediate: true
    }
  );

  return {
    activeRequestId,
    closeAdministrativeRequestDetail,
    drawerVisible,
    isLoading,
    isTabletOrDown,
    openAdministrativeRequestDetail,
    request,
    syncAdministrativeRequestDetail
  };
}
