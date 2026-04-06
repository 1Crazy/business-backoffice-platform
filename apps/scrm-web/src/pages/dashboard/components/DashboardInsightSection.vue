<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card intro-card">
    <div class="intro-copy">
      <span class="intro-kicker">决策辅助</span>
      <h2>数据解读</h2>
      <p>这个区域保留给销售主管快速判断节奏。新增商机、当前预测、赢单结果和待办提醒会在这里组成更完整的销售经营视图。</p>
    </div>
    <div class="insight-grid">
      <article class="insight-item">
        <span>管道金额</span>
        <strong>{{ formatAmount(overview?.pipelineForecastAmount ?? 0) }}</strong>
        <p>按预计成交时间统计的进行中商机金额。</p>
      </article>
      <article class="insight-item">
        <span>赢单数量</span>
        <strong>{{ overview?.wonOpportunities ?? 0 }}</strong>
        <p>按收口时间统计的赢单商机数量。</p>
      </article>
      <article class="insight-item">
        <span>赢单金额</span>
        <strong>{{ formatAmount(overview?.wonAmount ?? 0) }}</strong>
        <p>同周期赢单商机沉淀下来的总金额。</p>
      </article>
      <article class="insight-item">
        <span>已转客户</span>
        <strong>{{ overview?.convertedLeads ?? 0 }}</strong>
        <p>转化动作已经真正落入客户资产池的数量。</p>
      </article>
      <article class="insight-item">
        <span>待办提醒</span>
        <strong>{{ overview?.pendingReminders ?? 0 }}</strong>
        <p>仍需要继续追踪或处理的关键动作提醒。</p>
      </article>
    </div>
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
.intro-card {
  display: grid;
  gap: 18px;
}

.intro-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.intro-card h2 {
  margin: 0 0 10px;
}

.intro-card p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.insight-item {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(248, 251, 255, 0.82);
  border: 1px solid rgba(95, 125, 170, 0.14);
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
