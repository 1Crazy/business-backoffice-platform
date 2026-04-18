import { http } from "@/api/http";
import type { NotificationPreferenceRecord, UpsertNotificationPreferencesPayload } from "@/types/workfeed";

export async function fetchNotificationPreferences(): Promise<NotificationPreferenceRecord[]> {
  const { data } = await http.get<NotificationPreferenceRecord[]>("/notification-center/preferences");
  return data;
}

export async function updateNotificationPreferences(
  payload: UpsertNotificationPreferencesPayload
): Promise<NotificationPreferenceRecord[]> {
  const { data } = await http.put<NotificationPreferenceRecord[]>("/notification-center/preferences", payload);
  return data;
}
