<template>
  <el-drawer
    :model-value="visible"
    :title="drawerTitle"
    :size="drawerSize"
    class="workfeed-drawer"
    destroy-on-close
    @update:model-value="!$event && emit('close')"
  >
    <div v-if="entry" class="drawer-content">
      <div class="drawer-badges">
        <span class="drawer-badge">{{ getDomainLabel(entry.domain) }}</span>
        <span class="drawer-badge">{{ selectedTypeLabel }}</span>
        <span class="drawer-badge priority" :data-priority="entry.priority">
          {{ getPriorityLabel(entry.priority) }}
        </span>
      </div>

      <section class="drawer-panel">
        <h3>事项摘要</h3>
        <p>{{ entry.summary ?? entry.targetLabel }}</p>
      </section>

      <section class="drawer-panel">
        <h3>处理信息</h3>
        <dl class="drawer-meta-list">
          <div>
            <dt>{{ selectedTimeLabel }}</dt>
            <dd>{{ selectedTimeValue }}</dd>
          </div>
          <div>
            <dt>{{ selectedStatusLabel }}</dt>
            <dd>{{ selectedStatusValue }}</dd>
          </div>
        </dl>
      </section>

      <div class="drawer-actions">
        <el-button @click="emit('close')">关闭</el-button>
        <el-button type="primary" @click="emit('navigate')">
          {{ primaryActionLabel }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { formatDateTime } from "@/utils/display";
import {
  getDomainLabel,
  getNotificationTypeLabel,
  getPriorityLabel,
  getTodoStatusLabel,
  getTodoTypeLabel,
  type DrawerEntry,
  type DrawerEntryKind
} from "@/pages/workfeed/workfeed-helpers";
import type { WorkfeedNotification, WorkfeedTodo } from "@/types/workfeed";

const drawerSize = "min(840px, calc(100vw - 24px))";

const props = defineProps<{
  visible: boolean;
  entry: DrawerEntry | null;
  entryKind: DrawerEntryKind;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [];
}>();

const selectedTodoEntry = computed<WorkfeedTodo | null>(() =>
  props.entryKind === "todo" ? (props.entry as WorkfeedTodo | null) : null
);
const selectedNotificationEntry = computed<WorkfeedNotification | null>(() =>
  props.entryKind === "notification" ? (props.entry as WorkfeedNotification | null) : null
);
const drawerTitle = computed(() => props.entry?.title ?? "事项预览");
const selectedTypeLabel = computed(() =>
  selectedTodoEntry.value
    ? getTodoTypeLabel(selectedTodoEntry.value.type)
    : selectedNotificationEntry.value
      ? getNotificationTypeLabel(selectedNotificationEntry.value.type)
      : "-"
);
const selectedTimeLabel = computed(() => (selectedTodoEntry.value ? "参考时间" : "发生时间"));
const selectedTimeValue = computed(() =>
  selectedTodoEntry.value
    ? formatDateTime(selectedTodoEntry.value.dueAt ?? selectedTodoEntry.value.createdAt)
    : selectedNotificationEntry.value
      ? formatDateTime(selectedNotificationEntry.value.occurredAt)
      : "-"
);
const selectedStatusLabel = computed(() => (selectedTodoEntry.value ? "业务状态" : "通知状态"));
const selectedStatusValue = computed(() =>
  selectedTodoEntry.value
    ? getTodoStatusLabel(selectedTodoEntry.value.status)
    : selectedNotificationEntry.value
      ? selectedNotificationEntry.value.isRead
        ? "已读"
        : "未读"
      : "-"
);
const primaryActionLabel = computed(() =>
  selectedTodoEntry.value
    ? "进入处理"
    : selectedNotificationEntry.value?.isRead
      ? "进入原页"
      : "标记已读并进入"
);
</script>

<style scoped>
.drawer-content {
  display: grid;
  gap: 14px;
}

.drawer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
}

.drawer-badge.priority[data-priority="HIGH"] {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.drawer-badge.priority[data-priority="MEDIUM"] {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.drawer-badge.priority[data-priority="LOW"] {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.drawer-panel {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.drawer-panel h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.drawer-panel p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.drawer-meta-list {
  display: grid;
  gap: 12px;
  margin: 0;
}

.drawer-meta-list div {
  display: grid;
  gap: 4px;
}

.drawer-meta-list dt {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.drawer-meta-list dd {
  margin: 0;
  color: var(--app-text-primary);
  line-height: 1.7;
  word-break: break-all;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .drawer-actions {
    display: grid;
  }
}
</style>
