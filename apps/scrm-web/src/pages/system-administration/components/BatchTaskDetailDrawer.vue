<template>
  <el-drawer
    :model-value="visible"
    title="任务详情"
    size="min(560px, calc(100vw - 24px))"
    destroy-on-close
    @update:model-value="!$event && emit('close')"
  >
    <div v-if="task" class="drawer-content">
      <div class="drawer-badges">
        <span class="drawer-badge">{{ formatBatchTaskCategory(task.category) }}</span>
        <span class="drawer-badge">{{ task.domainLabel }}</span>
        <span class="drawer-badge">{{ formatBatchTaskStatus(task.status) }}</span>
      </div>

      <section class="drawer-panel">
        <h3>{{ task.label }}</h3>
        <p>{{ task.failureSummary || "当前没有失败明细。" }}</p>
      </section>

      <section class="drawer-panel">
        <dl class="drawer-meta">
          <div>
            <dt>处理人</dt>
            <dd>{{ task.operatorName }}</dd>
          </div>
          <div>
            <dt>进度</dt>
            <dd>{{ task.progress }}%</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{{ formatDateTime(task.updatedAt) }}</dd>
          </div>
          <div>
            <dt>失败条数</dt>
            <dd>{{ task.failureCount }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { BatchTaskRecord } from "@/types/system-administration";
import { formatBatchTaskCategory, formatBatchTaskStatus, formatDateTime } from "@/utils/display";

defineProps<{
  visible: boolean;
  task: BatchTaskRecord | null;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.drawer-content {
  display: grid;
  gap: 16px;
}

.drawer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.drawer-panel {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.9);
}

.drawer-panel h3,
.drawer-panel p,
.drawer-meta dt,
.drawer-meta dd {
  margin: 0;
}

.drawer-panel p {
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.drawer-meta {
  display: grid;
  gap: 12px;
}

.drawer-meta div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 760px) {
  .drawer-meta div {
    flex-direction: column;
  }
}
</style>
