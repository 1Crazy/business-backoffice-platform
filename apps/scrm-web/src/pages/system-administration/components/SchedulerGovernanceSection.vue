<template>
  <section class="job-grid">
    <article v-for="item in jobs" :key="item.id" class="job-card">
      <div class="job-top">
        <div>
          <strong>{{ item.label }}</strong>
          <p>{{ formatCronExpression(item.cronExpression) }}</p>
        </div>
        <span class="status-pill" :class="item.status.toLowerCase()">{{ formatSchedulerJobStatus(item.status) }}</span>
      </div>

      <div class="job-meta">
        <span>负责人：{{ item.ownerName }}</span>
        <span>上次：{{ formatDateTime(item.lastRunAt) }}</span>
        <span>下次：{{ formatDateTime(item.nextRunAt) }}</span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { SchedulerJobRecord } from "@/types/system-administration";
import { formatCronExpression, formatDateTime, formatSchedulerJobStatus } from "@/utils/display";

defineProps<{
  jobs: SchedulerJobRecord[];
}>();
</script>

<style scoped>
.job-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.job-card {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.job-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.job-top strong {
  font-size: 16px;
}

.job-top p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--app-text-secondary);
  font-size: 12px;
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

.status-pill.running {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill.paused {
  background: rgba(217, 119, 6, 0.12);
  color: #b45309;
}

@media (max-width: 960px) {
  .job-grid {
    grid-template-columns: 1fr;
  }

  .job-top {
    flex-direction: column;
  }
}
</style>
