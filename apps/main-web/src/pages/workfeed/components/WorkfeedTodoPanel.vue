<template>
  <section class="feed-panel">
    <div class="filter-row">
      <el-select
        :model-value="filters.domain"
        class="filter-field"
        placeholder="业务域"
        clearable
        @update:model-value="updateFilter('domain', $event)"
      >
        <el-option v-for="domain in domainOptions" :key="domain.value" :label="domain.label" :value="domain.value" />
      </el-select>
      <el-select
        :model-value="filters.type"
        class="filter-field"
        placeholder="待办类型"
        clearable
        @update:model-value="updateFilter('type', $event)"
      >
        <el-option v-for="type in todoTypeOptions" :key="type.value" :label="type.label" :value="type.value" />
      </el-select>
      <el-select
        :model-value="filters.priority"
        class="filter-field"
        placeholder="优先级"
        clearable
        @update:model-value="updateFilter('priority', $event)"
      >
        <el-option v-for="priority in priorityOptions" :key="priority.value" :label="priority.label" :value="priority.value" />
      </el-select>
      <div class="filter-actions">
        <el-button size="small" @click="$emit('reset')">重置待办</el-button>
      </div>
    </div>

    <div class="feed-grid">
      <div v-if="loading" class="feed-state">加载待办中…</div>
      <el-empty v-else-if="todos.length === 0" description="当前筛选条件下没有待办事项。" />
      <button v-for="todo in todos" v-else :key="todo.id" type="button" class="feed-entry-card" @click="$emit('open', todo)">
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
</template>

<script setup lang="ts">
import { formatDateTime } from "@/utils/display";
import { getDomainLabel, getPriorityLabel, getTodoTypeLabel, type WorkfeedSelectOption } from "@/pages/workfeed/workfeed-helpers";
import type { ListWorkfeedTodosParams, WorkfeedTodo } from "@/types/workfeed";

const props = defineProps<{
  filters: ListWorkfeedTodosParams;
  domainOptions: WorkfeedSelectOption[];
  todoTypeOptions: WorkfeedSelectOption[];
  priorityOptions: WorkfeedSelectOption[];
  todos: WorkfeedTodo[];
  loading: boolean;
}>();

const emit = defineEmits<{
  update: [value: ListWorkfeedTodosParams];
  reset: [];
  open: [todo: WorkfeedTodo];
}>();

function updateFilter<Key extends keyof ListWorkfeedTodosParams>(
  key: Key,
  value: ListWorkfeedTodosParams[Key] | ""
): void {
  emit("update", {
    ...props.filters,
    [key]: value || undefined
  });
}
</script>

<style scoped>
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

.feed-entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.feed-entry-domain,
.feed-entry-priority {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.feed-entry-domain {
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
}

.feed-entry-priority[data-priority="HIGH"] {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.feed-entry-priority[data-priority="MEDIUM"] {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.feed-entry-priority[data-priority="LOW"] {
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

@media (max-width: 1080px) {
  .feed-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .filter-row {
    display: grid;
  }

  .filter-actions {
    display: inline-flex;
    margin-left: 0;
  }
}
</style>
