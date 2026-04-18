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
  let todoRequestSequence = 0;
  let notificationRequestSequence = 0;

  async function loadTodos(params: ListWorkfeedTodosParams = {}) {
    const requestSequence = ++todoRequestSequence;
    loadingTodos.value = true;
    try {
      const nextTodos = await fetchWorkfeedTodos(params);

      if (requestSequence !== todoRequestSequence) {
        return;
      }

      todos.value = nextTodos;
    } catch {
      if (requestSequence !== todoRequestSequence) {
        return;
      }

      ElMessage.error("无法加载统一待办，请稍后重试。");
    } finally {
      if (requestSequence === todoRequestSequence) {
        loadingTodos.value = false;
      }
    }
  }

  async function loadNotifications(params: ListWorkfeedNotificationsParams = {}) {
    const requestSequence = ++notificationRequestSequence;
    loadingNotifications.value = true;
    try {
      const nextNotifications = await fetchWorkfeedNotifications(params);

      if (requestSequence !== notificationRequestSequence) {
        return;
      }

      notifications.value = nextNotifications;
    } catch {
      if (requestSequence !== notificationRequestSequence) {
        return;
      }

      ElMessage.error("无法加载统一通知，请稍后重试。");
    } finally {
      if (requestSequence === notificationRequestSequence) {
        loadingNotifications.value = false;
      }
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
