<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="insight-grid">
    <article class="page-card insight-item">
      <span>管道金额</span>
      <strong>{{ formatAmount(overview?.pipelineForecastAmount ?? 0) }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>赢单数量</span>
      <strong>{{ overview?.wonOpportunities ?? 0 }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>赢单金额</span>
      <strong>{{ formatAmount(overview?.wonAmount ?? 0) }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>已转客户</span>
      <strong>{{ overview?.convertedLeads ?? 0 }}</strong>
    </article>
    <article class="page-card insight-item">
      <span>待办提醒</span>
      <strong>{{ overview?.pendingReminders ?? 0 }}</strong>
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
