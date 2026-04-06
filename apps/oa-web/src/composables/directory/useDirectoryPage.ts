/** 通讯录 composable：负责部门筛选与成员查询编排。 */
import { ElMessage } from "element-plus";
import { onMounted, ref, watch } from "vue";

import { fetchDirectorySnapshot } from "@/api/directory.api";
import type { DirectoryDepartment, DirectoryMember } from "@/types/office-automation";
import { getRequestErrorMessage } from "@/utils/request";

export function useDirectoryPage() {
  const departments = ref<DirectoryDepartment[]>([]);
  const members = ref<DirectoryMember[]>([]);
  const selectedDepartmentId = ref<string | null>(null);

  async function loadData(): Promise<void> {
    try {
      const snapshot = await fetchDirectorySnapshot(selectedDepartmentId.value);
      departments.value = snapshot.departments;
      members.value = snapshot.members;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "组织通讯录加载失败，请稍后重试。"));
    }
  }

  watch(selectedDepartmentId, () => {
    void loadData();
  });

  onMounted(() => {
    void loadData();
  });

  return {
    departments,
    loadData,
    members,
    selectedDepartmentId
  };
}
