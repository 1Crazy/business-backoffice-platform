import { http } from "./http";

import type {
  ListWorkfeedNotificationsParams,
  ListWorkfeedTodosParams,
  WorkfeedNotification,
  WorkfeedTodo
} from "@/types/workfeed";

export async function fetchWorkfeedTodos(params: ListWorkfeedTodosParams = {}): Promise<WorkfeedTodo[]> {
  const { data } = await http.get<WorkfeedTodo[]>("/workfeed/todos", { params });
  return data;
}

export async function fetchWorkfeedNotifications(
  params: ListWorkfeedNotificationsParams = {}
): Promise<WorkfeedNotification[]> {
  const { data } = await http.get<WorkfeedNotification[]>("/workfeed/notifications", {
    params
  });
  return data;
}

export async function markWorkfeedNotificationRead(payload: {
  notificationType: string;
  sourceId: string;
}) {
  await http.post("/workfeed/notifications/read", payload);
}
