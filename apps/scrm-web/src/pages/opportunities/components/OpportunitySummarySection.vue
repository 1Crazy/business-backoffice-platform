<template>
  <section class="summary-panel">
    <div class="summary-header">
      <div>
        <h3>{{ opportunity.name }}</h3>
        <p>{{ opportunity.customer.name }} / {{ opportunity.owner.displayName }}</p>
      </div>
      <div class="tag-stack">
        <el-tag>{{ formatOpportunityStage(opportunity.stage) }}</el-tag>
        <el-tag :type="resultTagType">
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
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { Opportunity } from "@/types/opportunities";
import {
  formatAmount,
  formatDateTime,
  formatOpportunityResult,
  formatOpportunityStage
} from "@/utils/display";

const props = defineProps<{
  opportunity: Opportunity;
}>();

const resultTagType = computed(() => {
  if (props.opportunity.resultStatus === "WON") {
    return "success";
  }

  if (props.opportunity.resultStatus === "LOST") {
    return "danger";
  }

  return "warning";
});
</script>

<style scoped>
.summary-panel {
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

@media (max-width: 960px) {
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
