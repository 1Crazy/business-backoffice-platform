<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-drawer v-model="drawerVisible" title="商机详情" :size="isTabletOrDown ? '100%' : '680px'">
    <template v-if="opportunity">
      <div class="drawer-stack">
        <section class="summary-panel">
          <div class="summary-header">
            <div>
              <h3>{{ opportunity.name }}</h3>
              <p>{{ opportunity.customer.name }} / {{ opportunity.owner.displayName }}</p>
            </div>
            <div class="tag-stack">
              <el-tag>{{ formatOpportunityStage(opportunity.stage) }}</el-tag>
              <el-tag :type="opportunity.resultStatus === 'WON' ? 'success' : opportunity.resultStatus === 'LOST' ? 'danger' : 'warning'">
                {{ formatOpportunityResult(opportunity.resultStatus) }}
              </el-tag>
            </div>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="预计金额">{{ formatAmount(opportunity.expectedAmount) }}</el-descriptions-item>
            <el-descriptions-item label="预计成交">{{ formatDateTime(opportunity.expectedCloseDate) }}</el-descriptions-item>
            <el-descriptions-item label="来源线索">
              {{ opportunity.sourceLead?.name ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="收口时间">
              {{ formatDateTime(opportunity.closedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="下一步动作" :span="2">
              {{ opportunity.nextAction }}
            </el-descriptions-item>
            <el-descriptions-item v-if="opportunity.notes" label="补充说明" :span="2">
              {{ opportunity.notes }}
            </el-descriptions-item>
            <el-descriptions-item v-if="opportunity.lostReason" label="输单原因" :span="2">
              {{ opportunity.lostReason }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="timeline-panel">
          <div class="panel-title">推进轨迹</div>
          <el-timeline>
            <el-timeline-item
              v-for="item in opportunity.stageHistory ?? []"
              :key="item.id"
              :timestamp="formatDateTime(item.createdAt)"
            >
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
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { Opportunity } from "@/types/opportunities";
import { formatAmount, formatDateTime, formatOpportunityResult, formatOpportunityStage } from "@/utils/display";

const props = defineProps<{
  visible: boolean;
  opportunity: Opportunity | null;
  isTabletOrDown: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});
</script>

<style scoped>
.drawer-stack {
  display: grid;
  gap: 20px;
}

.summary-panel,
.timeline-panel {
  display: grid;
  gap: 16px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.summary-header h3 {
  margin: 0 0 6px;
}

.summary-header p {
  margin: 0;
  color: var(--app-text-secondary);
}

.tag-stack {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  .summary-header,
  .timeline-heading {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
