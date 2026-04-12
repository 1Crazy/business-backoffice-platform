<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="insight-grid">
    <article class="page-card insight-item">
      <span>进行中商机金额</span>
      <strong>{{ formatAmount(overview?.pipelineForecastAmount ?? 0) }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>赢单金额</span>
      <strong>{{ formatAmount(overview?.wonAmount ?? 0) }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>未回款金额</span>
      <strong>{{ formatAmount(overview?.receivableForecast.unreceivedAmount ?? 0) }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>逾期未回款</span>
      <strong>{{ formatAmount(overview?.receivableForecast.overdueAmount ?? 0) }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>平均审批时效</span>
      <strong>{{ `${overview?.approvalTimeliness.averageHours ?? 0}h` }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>超 48h 待审批</span>
      <strong>{{ overview?.approvalTimeliness.pendingOver48Hours ?? 0 }}</strong>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { DashboardOverview } from "@/types/dashboard";
import { formatAmount } from "@/utils/display";

defineProps<{
  overview: DashboardOverview | null;
}>();
</script>

<style scoped>
.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.insight-item {
  display: grid;
  gap: 6px;
  align-content: start;
}

.insight-item span {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.insight-item strong {
  font-size: 30px;
  line-height: 1;
}

@media (max-width: 960px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
