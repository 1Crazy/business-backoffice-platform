import { ref } from "vue";
import { ElMessage } from "element-plus";

import {
  fetchWorkfeedNotifications,
  fetchWorkfeedTodos,
  markWorkfeedNotificationRead
} from "@/api/workfeed.api";
import type {
  ListWorkfeedNotificationsParams,
  ListWorkfeedTodosParams,
  WorkfeedNotification,
  WorkfeedTodo
} from "@/types/workfeed";

export function useWorkfeedData() {
  const todos = ref<WorkfeedTodo[]>([]);
  const notifications = ref<WorkfeedNotification[]>([]);
  const loadingTodos = ref(false);
  const loadingNotifications = ref(false);

  async function loadTodos(params: ListWorkfeedTodosParams = {}) {
    loadingTodos.value = true;
    try {
      todos.value = await fetchWorkfeedTodos(params);
    } catch (error) {
      ElMessage.error("无法加载统一待办，请稍后重试。");
    } finally {
      loadingTodos.value = false;
    }
  }

  async function loadNotifications(params: ListWorkfeedNotificationsParams = {}) {
    loadingNotifications.value = true;
    try {
      notifications.value = await fetchWorkfeedNotifications(params);
    } catch (error) {
      ElMessage.error("无法加载统一通知，请稍后重试。");
    } finally {
      loadingNotifications.value = false;
    }
  }

  async function markNotificationAsRead(notification: WorkfeedNotification) {
    try {
      await markWorkfeedNotificationRead({
        notificationType: notification.type,
        sourceId: notification.sourceId
      });
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
    } catch (error) {
      ElMessage.error("标记通知已读失败，请稍后重试。");
    }
  }

  return {
    todos,
    notifications,
    loadingTodos,
    loadingNotifications,
    loadTodos,
    loadNotifications,
    markNotificationAsRead
  };
}
