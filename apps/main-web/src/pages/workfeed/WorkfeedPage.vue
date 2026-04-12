<template>
  <section class="workfeed-page">
    <section class="page-card workfeed-hero">
      <div class="workfeed-hero-copy">
        <span class="page-kicker">协同工作台</span>
        <h1>统一待办与通知</h1>
        <p>先处理待办，再进入原业务页。</p>
      </div>

      <div class="workfeed-hero-metrics">
        <article class="metric-tile">
          <span>待办</span>
          <strong>{{ todos.length }}</strong>
          <small>当前聚合事项</small>
        </article>
        <article class="metric-tile">
          <span>通知</span>
          <strong>{{ notifications.length }}</strong>
          <small>最近业务消息</small>
        </article>
        <article class="metric-tile">
          <span>未读</span>
          <strong>{{ unreadCount }}</strong>
          <small>需要优先关注</small>
        </article>
      </div>
    </section>

    <section class="page-card workfeed-shell">
      <div class="workfeed-shell-head">
        <div>
          <h2 class="page-section-title">工作入口</h2>
          <p class="page-section-caption">筛选后直接处理。</p>
        </div>
        <span class="scope-pill">{{ activeTab === "todos" ? "待办视图" : "通知视图" }}</span>
      </div>

      <el-tabs v-model="activeTab" class="workfeed-tabs">
        <el-tab-pane label="待办" name="todos" />
        <el-tab-pane label="通知" name="notifications" />
      </el-tabs>

      <section v-if="activeTab === 'todos'" class="feed-panel">
        <div class="filter-row">
          <el-select v-model="todoFilters.domain" class="filter-field" placeholder="业务域" clearable>
            <el-option v-for="domain in domainOptions" :key="domain.value" :label="domain.label" :value="domain.value" />
          </el-select>
          <el-select v-model="todoFilters.type" class="filter-field" placeholder="待办类型" clearable>
            <el-option v-for="type in todoTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
          <el-select v-model="todoFilters.priority" class="filter-field" placeholder="优先级" clearable>
            <el-option
              v-for="priority in priorityOptions"
              :key="priority.value"
              :label="priority.label"
              :value="priority.value"
            />
          </el-select>
          <div class="filter-actions">
            <el-button size="small" @click="resetTodoFilters">重置待办</el-button>
          </div>
        </div>

        <div class="feed-grid">
          <div v-if="loadingTodos" class="feed-state">加载待办中…</div>
          <el-empty v-else-if="todos.length === 0" description="当前筛选条件下没有待办事项。" />
          <button
            v-for="todo in todos"
            v-else
            :key="todo.id"
            type="button"
            class="feed-entry-card"
            @click="openTodoDrawer(todo)"
          >
            <div class="feed-entry-top">
              <span class="feed-entry-domain">{{ getDomainLabel(todo.domain) }}</span>
              <span class="feed-entry-priority" :data-priority="todo.priority">{{ getPriorityLabel(todo.priority) }}</span>
            </div>
            <strong class="feed-entry-title">{{ todo.title }}</strong>
            <p class="feed-entry-summary">{{ todo.summary ?? todo.targetLabel }}</p>
            <div class="feed-entry-meta">
              <span>{{ formatDateTime(todo.dueAt ?? todo.createdAt) }}</span>
              <span>{{ getTodoTypeLabel(todo.type) }}</span>
            </div>
          </button>
        </div>
      </section>

      <section v-else class="feed-panel">
        <div class="filter-row">
          <el-select v-model="notificationFilters.domain" class="filter-field" placeholder="业务域" clearable>
            <el-option v-for="domain in domainOptions" :key="domain.value" :label="domain.label" :value="domain.value" />
          </el-select>
          <el-select v-model="notificationFilters.type" class="filter-field" placeholder="通知类型" clearable>
            <el-option v-for="type in notificationTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
          <el-switch v-model="notificationFilters.unreadOnly" active-text="仅未读" inactive-text="全部通知" />
          <div class="filter-actions">
            <el-button size="small" @click="resetNotificationFilters">重置通知</el-button>
          </div>
        </div>

        <div class="feed-grid">
          <div v-if="loadingNotifications" class="feed-state">加载通知中…</div>
          <el-empty v-else-if="notifications.length === 0" description="当前筛选条件下没有通知消息。" />
          <button
            v-for="notification in notifications"
            v-else
            :key="notification.id"
            type="button"
            class="feed-entry-card"
            :class="{ unread: !notification.isRead }"
            @click="openNotificationDrawer(notification)"
          >
            <div class="feed-entry-top">
              <span class="feed-entry-domain">{{ getDomainLabel(notification.domain) }}</span>
              <span class="feed-entry-priority" :data-priority="notification.priority">
                {{ getPriorityLabel(notification.priority) }}
              </span>
            </div>
            <strong class="feed-entry-title">{{ notification.title }}</strong>
            <p class="feed-entry-summary">{{ notification.summary ?? notification.targetLabel }}</p>
            <div class="feed-entry-meta">
              <span>{{ formatDateTime(notification.occurredAt) }}</span>
              <span>{{ getNotificationTypeLabel(notification.type) }}</span>
            </div>
            <span v-if="!notification.isRead" class="feed-entry-unread">未读</span>
          </button>
        </div>
      </section>
    </section>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      :size="drawerSize"
      class="workfeed-drawer"
      destroy-on-close
    >
        <div v-if="selectedEntry" class="drawer-content">
          <div class="drawer-badges">
            <span class="drawer-badge">{{ getDomainLabel(selectedEntry.domain) }}</span>
            <span class="drawer-badge">{{ selectedTypeLabel }}</span>
            <span class="drawer-badge priority" :data-priority="selectedEntry.priority">
              {{ getPriorityLabel(selectedEntry.priority) }}
            </span>
          </div>

        <section class="drawer-panel">
          <h3>事项摘要</h3>
          <p>{{ selectedEntry.summary ?? selectedEntry.targetLabel }}</p>
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
          <el-button @click="drawerVisible = false">关闭</el-button>
          <el-button type="primary" @click="navigateFromDrawer">
            {{ primaryActionLabel }}
          </el-button>
        </div>
      </div>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useWorkfeedData } from "@/composables/workfeed/useWorkfeed";
import { formatDateTime } from "@/utils/display";
import {
  NOTIFICATION_TYPES,
  TODO_TYPES,
  WORKFEED_DOMAINS,
  WORKFEED_DOMAIN_LABELS,
  WORKFEED_PRIORITIES,
  type ListWorkfeedNotificationsParams,
  type ListWorkfeedTodosParams,
  type WorkfeedNotification,
  type WorkfeedNotificationType,
  type WorkfeedPriority,
  type WorkfeedTodo,
  type WorkfeedTodoType
} from "@/types/workfeed";

type DrawerEntry = WorkfeedTodo | WorkfeedNotification;
type DrawerEntryKind = "todo" | "notification";

const router = useRouter();
const activeTab = ref<"todos" | "notifications">("todos");
const todoFilters = ref<ListWorkfeedTodosParams>({});
const notificationFilters = ref<ListWorkfeedNotificationsParams>({ unreadOnly: false });
const drawerVisible = ref(false);
const drawerSize = "min(840px, calc(100vw - 24px))";
const selectedEntry = ref<DrawerEntry | null>(null);
const selectedEntryKind = ref<DrawerEntryKind>("todo");

const {
  todos,
  notifications,
  loadingTodos,
  loadingNotifications,
  loadTodos,
  loadNotifications,
  markNotificationAsRead
} = useWorkfeedData();

const unreadCount = computed(() => notifications.value.filter((item) => !item.isRead).length);
const drawerTitle = computed(() => selectedEntry.value?.title ?? "事项预览");
const selectedTodoEntry = computed<WorkfeedTodo | null>(() =>
  selectedEntryKind.value === "todo" ? (selectedEntry.value as WorkfeedTodo | null) : null
);
const selectedNotificationEntry = computed<WorkfeedNotification | null>(() =>
  selectedEntryKind.value === "notification" ? (selectedEntry.value as WorkfeedNotification | null) : null
);
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
const domainOptions = computed(() =>
  WORKFEED_DOMAINS.map((domain) => ({
    value: domain,
    label: WORKFEED_DOMAIN_LABELS[domain]
  }))
);
const todoTypes = computed(() =>
  TODO_TYPES.map((type) => ({
    value: type,
    label: getTodoTypeLabel(type)
  }))
);
const notificationTypes = computed(() =>
  NOTIFICATION_TYPES.map((type) => ({
    value: type,
    label: getNotificationTypeLabel(type)
  }))
);
const priorityOptions = computed(() =>
  WORKFEED_PRIORITIES.map((priority) => ({
    value: priority,
    label: getPriorityLabel(priority)
  }))
);
const skipNextTodoAutoSearch = ref(false);
const skipNextNotificationAutoSearch = ref(false);

const PRIORITY_LABELS: Record<WorkfeedPriority, string> = {
  HIGH: "高优先",
  MEDIUM: "中优先",
  LOW: "低优先"
};

const TODO_TYPE_LABELS: Record<WorkfeedTodoType, string> = {
  LEAVE_APPROVAL: "请假审批",
  ADMINISTRATIVE_APPROVAL: "行政审批",
  CUSTOMER_REMINDER: "客户提醒",
  LEAD_REMINDER: "线索提醒",
  RENEWAL_REMINDER: "续费提醒"
};

const NOTIFICATION_TYPE_LABELS: Record<WorkfeedNotificationType, string> = {
  LEAVE_RESULT: "请假结果",
  ADMINISTRATIVE_RESULT: "行政结果",
  CUSTOMER_REMINDER: "客户提醒",
  LEAD_REMINDER: "线索提醒",
  RENEWAL_REMINDER: "续费提醒",
  ANNOUNCEMENT: "公告摘要"
};

const TODO_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "处理中",
  COMPLETED: "已完成"
};

function getPriorityLabel(priority: WorkfeedPriority) {
  return PRIORITY_LABELS[priority] ?? priority;
}

function getTodoTypeLabel(type: WorkfeedTodoType) {
  return TODO_TYPE_LABELS[type] ?? type;
}

function getNotificationTypeLabel(type: WorkfeedNotificationType) {
  return NOTIFICATION_TYPE_LABELS[type] ?? type;
}

function getTodoStatusLabel(status: string) {
  return TODO_STATUS_LABELS[status] ?? status;
}

function getDomainLabel(domain: string) {
  return WORKFEED_DOMAIN_LABELS[domain as keyof typeof WORKFEED_DOMAIN_LABELS] ?? domain;
}

function buildTodoQuery() {
  return {
    domain: todoFilters.value.domain || undefined,
    type: todoFilters.value.type || undefined,
    priority: todoFilters.value.priority || undefined
  } satisfies ListWorkfeedTodosParams;
}

function buildNotificationQuery() {
  return {
    domain: notificationFilters.value.domain || undefined,
    type: notificationFilters.value.type || undefined,
    unreadOnly: notificationFilters.value.unreadOnly ?? false
  } satisfies ListWorkfeedNotificationsParams;
}

function resetTodoFilters() {
  skipNextTodoAutoSearch.value = true;
  todoFilters.value = {};
  void loadTodos();
}

function resetNotificationFilters() {
  skipNextNotificationAutoSearch.value = true;
  notificationFilters.value = { unreadOnly: false };
  void loadNotifications({ unreadOnly: false });
}

function openTodoDrawer(todo: WorkfeedTodo) {
  selectedEntry.value = todo;
  selectedEntryKind.value = "todo";
  drawerVisible.value = true;
}

function openNotificationDrawer(notification: WorkfeedNotification) {
  selectedEntry.value = notification;
  selectedEntryKind.value = "notification";
  drawerVisible.value = true;
}

async function navigateFromDrawer() {
  if (!selectedEntry.value) {
    return;
  }

  if (selectedNotificationEntry.value && !selectedNotificationEntry.value.isRead) {
    await markNotificationAsRead(selectedNotificationEntry.value);
  }

  drawerVisible.value = false;
  await router.push(selectedEntry.value.targetPath);
}

onMounted(() => {
  void loadTodos();
  void loadNotifications();
});

watch(
  todoFilters,
  () => {
    if (skipNextTodoAutoSearch.value) {
      skipNextTodoAutoSearch.value = false;
      return;
    }
    void loadTodos(buildTodoQuery());
  },
  { deep: true }
);

watch(
  notificationFilters,
  () => {
    if (skipNextNotificationAutoSearch.value) {
      skipNextNotificationAutoSearch.value = false;
      return;
    }
    void loadNotifications(buildNotificationQuery());
  },
  { deep: true }
);
</script>

<style scoped>
.workfeed-page {
  display: grid;
  gap: 20px;
}

.workfeed-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 18px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.92));
}

.workfeed-hero-copy {
  display: grid;
  gap: 10px;
  align-content: start;
}

.workfeed-hero-copy h1 {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.workfeed-hero-copy p {
  margin: 0;
  max-width: 720px;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.workfeed-hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-tile {
  display: grid;
  gap: 8px;
  align-content: start;
  min-height: 148px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.86);
}

.metric-tile span,
.metric-tile small {
  color: var(--app-text-secondary);
}

.metric-tile span {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-tile strong {
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1;
}

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

.feed-panel {
  display: grid;
  gap: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-field {
  min-width: 150px;
  flex: 1 1 170px;
  max-width: 220px;
}

.filter-actions {
  display: inline-flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 8px;
  margin-left: auto;
  min-width: max-content;
}

.filter-actions :deep(.el-button) {
  min-width: 92px;
  height: 30px;
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.filter-actions :deep(.el-button > span) {
  white-space: nowrap;
}

.feed-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feed-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  border-radius: 20px;
  border: 1px dashed rgba(95, 125, 170, 0.24);
  color: var(--app-text-secondary);
  background: rgba(248, 251, 255, 0.82);
}

.feed-entry-card {
  position: relative;
  display: grid;
  gap: 12px;
  min-height: 218px;
  padding: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  border-radius: 20px;
  color: inherit;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.92)),
    #ffffff;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.feed-entry-card:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.24);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
}

.feed-entry-card.unread::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, #f59e0b, #f97316);
}

.feed-entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.feed-entry-domain,
.feed-entry-priority,
.feed-entry-unread,
.drawer-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.feed-entry-domain,
.drawer-badge {
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
}

.feed-entry-priority[data-priority="HIGH"],
.drawer-badge.priority[data-priority="HIGH"] {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.feed-entry-priority[data-priority="MEDIUM"],
.drawer-badge.priority[data-priority="MEDIUM"] {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.feed-entry-priority[data-priority="LOW"],
.drawer-badge.priority[data-priority="LOW"] {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.feed-entry-title {
  font-size: 20px;
  line-height: 1.35;
}

.feed-entry-summary {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.feed-entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: auto;
  color: var(--app-text-tertiary);
  font-size: 13px;
}

.feed-entry-unread {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.drawer-content {
  display: grid;
  gap: 14px;
}

.drawer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

@media (max-width: 1080px) {
  .workfeed-hero,
  .feed-grid {
    grid-template-columns: 1fr;
  }

  .workfeed-hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .workfeed-hero-metrics {
    grid-template-columns: 1fr;
  }

  .workfeed-shell-head,
  .filter-row,
  .drawer-actions {
    display: grid;
  }

  .filter-actions {
    display: inline-flex;
    margin-left: 0;
  }
}
</style>
