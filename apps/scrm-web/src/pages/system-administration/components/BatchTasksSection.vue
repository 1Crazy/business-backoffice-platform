<template>
  <section class="batch-shell">
    <div class="filter-row">
      <el-select
        :model-value="filters.category"
        clearable
        placeholder="全部类型"
        class="filter-field"
        @update:model-value="$emit('update:category', $event || '')"
      >
        <el-option v-for="item in categoryOptions" :key="item" :label="formatBatchTaskCategory(item)" :value="item" />
      </el-select>
      <el-select
        :model-value="filters.status"
        clearable
        placeholder="全部状态"
        class="filter-field"
        @update:model-value="$emit('update:status', $event || '')"
      >
        <el-option v-for="item in statusOptions" :key="item" :label="formatBatchTaskStatus(item)" :value="item" />
      </el-select>
      <el-button @click="$emit('reset')">重置</el-button>
    </div>

    <div class="task-list" v-if="tasks.length">
      <article v-for="item in tasks" :key="item.id" class="task-card">
        <div class="task-top">
          <div>
            <strong>{{ item.label }}</strong>
            <p>{{ item.domainLabel }}</p>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">{{ formatBatchTaskStatus(item.status) }}</span>
        </div>

        <div class="task-progress">
          <div class="task-progress-bar">
            <span class="task-progress-value" :style="{ width: `${item.progress}%` }" />
          </div>
          <small>{{ item.progress }}%</small>
        </div>

        <div class="task-meta">
          <span>{{ formatBatchTaskCategory(item.category) }}</span>
          <span>失败 {{ item.failureCount }}</span>
          <span>{{ formatDateTime(item.updatedAt) }}</span>
          <span>{{ item.operatorName }}</span>
        </div>

        <div class="task-actions">
          <el-button text @click="$emit('view', item)">查看</el-button>
        </div>
      </article>
    </div>
    <el-empty v-else description="当前筛选下没有批处理任务" />

    <BatchTaskDetailDrawer
      :visible="drawerVisible"
      :task="selectedTask"
      @close="$emit('close')"
    />
  </section>
</template>

<script setup lang="ts">
import BatchTaskDetailDrawer from "./BatchTaskDetailDrawer.vue";

import type { BatchTaskCategory, BatchTaskFilters, BatchTaskRecord, BatchTaskStatus } from "@/types/system-administration";
import { formatBatchTaskCategory, formatBatchTaskStatus, formatDateTime } from "@/utils/display";

defineProps<{
  filters: BatchTaskFilters;
  categoryOptions: readonly BatchTaskCategory[];
  statusOptions: readonly BatchTaskStatus[];
  tasks: BatchTaskRecord[];
  selectedTask: BatchTaskRecord | null;
  drawerVisible: boolean;
}>();

defineEmits<{
  reset: [];
  "update:category": [value: BatchTaskCategory | ""];
  "update:status": [value: BatchTaskStatus | ""];
  view: [task: BatchTaskRecord];
  close: [];
}>();
</script>

<style scoped>
.batch-shell {
  display: grid;
  gap: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-field {
  width: 180px;
}

.task-list {
  display: grid;
  gap: 14px;
}

.task-card {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.task-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.task-top strong {
  font-size: 16px;
}

.task-top p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill.pending {
  background: rgba(148, 163, 184, 0.14);
  color: #475569;
}

.status-pill.running {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.status-pill.succeeded {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill.failed {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-progress-bar {
  position: relative;
  flex: 1;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.task-progress-value {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #1d4ed8);
}

.task-progress small,
.task-meta {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .filter-field {
    width: 100%;
  }

  .task-top {
    flex-direction: column;
  }
}
</style>
