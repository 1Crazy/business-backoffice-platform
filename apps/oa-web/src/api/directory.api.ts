/** OA 通讯录 API：负责封装组织通讯录查询请求。 */
import { http } from "@/api/http";
import type { DirectorySnapshot } from "@/types/office-automation";

export async function fetchDirectorySnapshot(departmentId?: string | null): Promise<DirectorySnapshot> {
  const { data } = await http.get<DirectorySnapshot>("/oa/directory", {
    params: departmentId ? { departmentId } : undefined
  });

  return data;
}
