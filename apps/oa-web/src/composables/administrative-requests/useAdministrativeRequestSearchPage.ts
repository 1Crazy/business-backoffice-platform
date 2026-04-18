/** 行政申请检索 composable：负责管理员筛选、成员选项加载与列表请求编排。 */
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";

import { fetchAdministrativeRequestRecords } from "@/api/administrative-requests.api";
import { fetchDirectorySnapshot } from "@/api/directory.api";
import type {
  AdministrativeRequestItem,
  AdministrativeRequestStatus,
  AdministrativeRequestType,
  DirectoryMember,
  ListAdministrativeRequestQuery
} from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

interface AdministrativeRequestSearchFilters {
  type: AdministrativeRequestType | "";
  status: AdministrativeRequestStatus | "";
  applicantId: string;
  approverId: string;
  startDate: string;
  endDate: string;
}

export function useAdministrativeRequestSearchPage() {
  const requests = ref<AdministrativeRequestItem[]>([]);
  const members = ref<DirectoryMember[]>([]);
  const isLoading = ref(true);
  const isMemberLoading = ref(true);

  const filters = reactive<AdministrativeRequestSearchFilters>({
    type: "",
    status: "",
    applicantId: "",
    approverId: "",
    startDate: "",
    endDate: ""
  });

  const memberOptions = computed(() =>
    [...members.value].sort((left, right) => left.displayName.localeCompare(right.displayName, "zh-CN"))
  );

  function buildQuery(): ListAdministrativeRequestQuery {
    return {
      type: filters.type || undefined,
      status: filters.status || undefined,
      applicantId: filters.applicantId || undefined,
      approverId: filters.approverId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    };
  }

  async function loadMembers(): Promise<void> {
    isMemberLoading.value = true;

    try {
      const snapshot = await fetchDirectorySnapshot();
      members.value = snapshot.members;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "通讯录成员加载失败，请稍后重试。"));
    } finally {
      isMemberLoading.value = false;
    }
  }

  async function loadData(): Promise<void> {
    isLoading.value = true;

    try {
      requests.value = await fetchAdministrativeRequestRecords(buildQuery());
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "行政申请检索失败，请稍后重试。"));
    } finally {
      isLoading.value = false;
    }
  }

  function resetFilters(): void {
    filters.type = "";
    filters.status = "";
    filters.applicantId = "";
    filters.approverId = "";
    filters.startDate = "";
    filters.endDate = "";
    void loadData();
  }

  onMounted(() => {
    void Promise.all([loadMembers(), loadData()]);
  });

  return {
    filters,
    isLoading,
    isMemberLoading,
    loadData,
    memberOptions,
    requests,
    resetFilters
  };
}
