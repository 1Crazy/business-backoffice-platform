<template>
  <section class="page-card workfeed-shell">
    <div class="workfeed-shell-head">
      <div>
        <h2 class="page-section-title">工作入口</h2>
        <p class="page-section-caption">筛选后直接处理。</p>
      </div>
      <span class="scope-pill">{{ activeTab === "todos" ? "待办视图" : "通知视图" }}</span>
    </div>

    <el-tabs
      :model-value="activeTab"
      class="workfeed-tabs"
      @update:model-value="$emit('update:active-tab', $event)"
    >
      <el-tab-pane label="待办" name="todos" />
      <el-tab-pane label="通知" name="notifications" />
    </el-tabs>

    <WorkfeedTodoPanel
      v-if="activeTab === 'todos'"
      :filters="todoFilters"
      :domain-options="domainOptions"
      :todo-type-options="todoTypeOptions"
      :priority-options="priorityOptions"
      :todos="todos"
      :loading="loadingTodos"
      @update="$emit('update:todo-filters', $event)"
      @reset="$emit('reset-todos')"
      @open="$emit('open-todo', $event)"
    />

    <WorkfeedNotificationPanel
      v-else
      :filters="notificationFilters"
      :domain-options="domainOptions"
      :notification-type-options="notificationTypeOptions"
      :notifications="notifications"
      :loading="loadingNotifications"
      @update="$emit('update:notification-filters', $event)"
      @reset="$emit('reset-notifications')"
      @open="$emit('open-notification', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import WorkfeedNotificationPanel from "@/pages/workfeed/components/WorkfeedNotificationPanel.vue";
import WorkfeedTodoPanel from "@/pages/workfeed/components/WorkfeedTodoPanel.vue";
import type { WorkfeedSelectOption, WorkfeedTab } from "@/pages/workfeed/workfeed-helpers";
import type {
  ListWorkfeedNotificationsParams,
  ListWorkfeedTodosParams,
  WorkfeedNotification,
  WorkfeedTodo
} from "@/types/workfeed";

defineProps<{
  activeTab: WorkfeedTab;
  todoFilters: ListWorkfeedTodosParams;
  notificationFilters: ListWorkfeedNotificationsParams;
  domainOptions: WorkfeedSelectOption[];
  todoTypeOptions: WorkfeedSelectOption[];
  notificationTypeOptions: WorkfeedSelectOption[];
  priorityOptions: WorkfeedSelectOption[];
  todos: WorkfeedTodo[];
  notifications: WorkfeedNotification[];
  loadingTodos: boolean;
  loadingNotifications: boolean;
}>();

defineEmits<{
  "update:active-tab": [value: WorkfeedTab];
  "update:todo-filters": [value: ListWorkfeedTodosParams];
  "update:notification-filters": [value: ListWorkfeedNotificationsParams];
  "reset-todos": [];
  "reset-notifications": [];
  "open-todo": [todo: WorkfeedTodo];
  "open-notification": [notification: WorkfeedNotification];
}>();
</script>

<style scoped>
.workfeed-shell {
  display: grid;
  gap: 16px;
}

.workfeed-shell-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.scope-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.workfeed-tabs :deep(.el-tabs__content) {
  display: none;
}

@media (max-width: 768px) {
  .workfeed-shell-head {
    display: grid;
  }
}
</style>
