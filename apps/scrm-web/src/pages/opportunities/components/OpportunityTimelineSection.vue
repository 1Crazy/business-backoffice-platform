<template>
  <section class="timeline-panel">
    <div class="panel-title">推进轨迹</div>
    <el-timeline>
      <el-timeline-item v-for="item in stageHistory" :key="item.id" :timestamp="formatDateTime(item.createdAt)">
        <div class="timeline-card">
          <div class="timeline-heading">
            <strong>{{ item.fromStage ? `${formatOpportunityStage(item.fromStage)} -> ${formatOpportunityStage(item.toStage)}` : `进入 ${formatOpportunityStage(item.toStage)}` }}</strong>
            <span>{{ item.createdBy.displayName }}</span>
          </div>
          <p>{{ item.comment || "未填写备注" }}</p>
        </div>
      </el-timeline-item>
    </el-timeline>
  </section>
</template>

<script setup lang="ts">
import type { OpportunityStageHistory } from "@/types/opportunities";
import { formatDateTime, formatOpportunityStage } from "@/utils/display";

defineProps<{
  stageHistory: OpportunityStageHistory[];
}>();
</script>

<style scoped>
.timeline-panel {
  display: grid;
  gap: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.timeline-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(248, 251, 255, 0.82);
  border: 1px solid rgba(95, 125, 170, 0.14);
}

.timeline-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.timeline-heading span,
.timeline-card p {
  color: var(--app-text-secondary);
}

.timeline-card p {
  margin: 0;
  line-height: 1.7;
}

@media (max-width: 960px) {
  .timeline-heading {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
