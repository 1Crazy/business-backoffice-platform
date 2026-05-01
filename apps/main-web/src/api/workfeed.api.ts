import { http } from "./http";

import type {
  ListWorkfeedNotificationsParams,
  ListWorkfeedTodosParams,
  WorkfeedNotification,
  WorkfeedTodo
} from "@/types/workfeed";

function normalizeWorkfeedItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }

  return [];
}

export async function fetchWorkfeedTodos(params: ListWorkfeedTodosParams = {}): Promise<WorkfeedTodo[]> {
  const { data } = await http.get<WorkfeedTodo[]>("/workfeed/todos", { params });
  return normalizeWorkfeedItems<WorkfeedTodo>(data);
}

export async function fetchWorkfeedNotifications(
  params: ListWorkfeedNotificationsParams = {}
): Promise<WorkfeedNotification[]> {
  const { data } = await http.get<WorkfeedNotification[]>("/workfeed/notifications", {
    params
  });
  return normalizeWorkfeedItems<WorkfeedNotification>(data);
}

export async function markWorkfeedNotificationRead(payload: {
  notificationType: string;
  sourceId: string;
}) {
  await http.post("/workfeed/notifications/read", payload);
}
