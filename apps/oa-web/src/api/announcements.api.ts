/** OA 公告 API：负责封装公告列表与详情查询请求。 */
import { http } from "@/api/http";
import type { AnnouncementDetail, AnnouncementSummary } from "@/types/office-automation";

export async function fetchAnnouncements(): Promise<AnnouncementSummary[]> {
  const { data } = await http.get<AnnouncementSummary[]>("/oa/announcements");
  return data;
}

export async function fetchAnnouncementDetail(announcementId: string): Promise<AnnouncementDetail> {
  const { data } = await http.get<AnnouncementDetail>(`/oa/announcements/${announcementId}`);
  return data;
}
