<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card overview-card">
    <div class="section-head">
      <div class="section-copy">
        <span class="page-kicker">销售概览</span>
        <h3 class="page-section-title">本期经营态势</h3>
        <p class="page-section-caption">把线索蓄水、商机推进、赢单结果和协同风险放在一处，帮助主管先看结果，再查阶段。</p>
      </div>

      <div class="summary-badges">
        <article class="summary-badge">
          <span>商机赢单率</span>
          <strong>{{ opportunityWinRate }}</strong>
        </article>
        <article class="summary-badge">
          <span>线索转化率</span>
          <strong>{{ leadConversionRate }}</strong>
        </article>
        <article class="summary-badge">
          <span>赢单商机</span>
          <strong>{{ overview?.wonOpportunities ?? 0 }}</strong>
        </article>
      </div>
    </div>

    <div class="overview-grid">
      <article class="hero-panel">
        <span class="hero-kicker">结果面</span>
        <strong class="hero-value">{{ formatAmount(overview?.wonAmount ?? 0) }}</strong>
        <p class="hero-copy">本期赢单金额，对应 {{ overview?.wonOpportunities ?? 0 }} 个已收口商机。</p>

        <div class="hero-metrics">
          <article
            v-for="metric in highlightMetrics"
            :key="metric.label"
            class="hero-metric"
            :class="{ warning: metric.emphasis === 'warning' }"
          >
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>
      </article>

      <div class="stage-grid">
        <template v-if="normalizedItems.length > 0">
          <article v-for="item in normalizedItems" :key="item.key" class="stage-card">
            <div class="stage-head">
              <div>
                <span class="stage-label">{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </div>
              <small>{{ item.amountLabel }}</small>
            </div>

            <div class="stage-track" aria-hidden="true">
              <span class="stage-bar" :style="{ width: `${item.progress}%` }" />
            </div>

            <p>{{ item.helperText }}</p>
          </article>
        </template>

        <article v-else class="stage-card empty-stage-card">
          <span class="stage-label">阶段分布</span>
          <strong>暂无数据</strong>
          <p>当前筛选范围内还没有可展示的线索或商机阶段记录。</p>
        </article>
      </div>
    </div>

    <div class="signal-grid">
      <article v-for="signal in signalMetrics" :key="signal.label" class="signal-card">
        <span>{{ signal.label }}</span>
        <strong>{{ signal.value }}</strong>
        <p>{{ signal.caption }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { DashboardFunnelItem, DashboardOverview } from "@/types/dashboard";
import { formatAmount } from "@/utils/display";

const props = defineProps<{
  items: DashboardFunnelItem[];
  overview: DashboardOverview | null;
}>();

const opportunityWinRate = computed(() =>
  props.overview ? `${props.overview.opportunityWinRate}%` : "--"
);

const leadConversionRate = computed(() =>
  props.overview ? `${props.overview.conversionRate}%` : "--"
);

const highlightMetrics = computed(() => [
  {
    label: "进行中商机金额",
    value: formatAmount(props.overview?.pipelineForecastAmount ?? 0)
  },
  {
    label: "未回款金额",
    value: formatAmount(props.overview?.receivableForecast.unreceivedAmount ?? 0)
  },
  {
    label: "逾期未回款",
    value: formatAmount(props.overview?.receivableForecast.overdueAmount ?? 0),
    emphasis: "warning" as const
  }
]);

const signalMetrics = computed(() => [
  {
    label: "待处理提醒",
    value: props.overview?.pendingReminders ?? 0,
    caption: "需要销售尽快处理的提醒条目。"
  },
  {
    label: "48h 待审批",
    value: props.overview?.approvalTimeliness.pendingOver48Hours ?? 0,
    caption: "影响推进节奏的审批积压。"
  },
  {
    label: "平均审批时效",
    value: props.overview ? `${props.overview.approvalTimeliness.averageHours}h` : "--",
    caption: "跨销售与 OA 协同的平均处理耗时。"
  }
]);

const normalizedItems = computed(() => {
  const maxCount = Math.max(0, ...props.items.map((item) => item.count));

  return props.items.map((item) => {
    const ratio = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;

    return {
      ...item,
      progress: item.count > 0 ? Math.max(ratio, 12) : 0,
      amountLabel: item.amount > 0 ? formatAmount(item.amount) : "金额口径不适用",
      helperText:
        item.count === 0
          ? "当前阶段暂无记录"
          : ratio === 100
            ? "当前数量最高的阶段"
            : `约为峰值阶段的 ${ratio}%`
    };
  });
});
</script>

<style scoped>
.overview-card {
  display: grid;
  gap: 20px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: start;
  flex-wrap: wrap;
}

.section-copy {
  display: grid;
  gap: 8px;
  max-width: 640px;
}

.page-kicker {
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-section-title {
  margin: 0;
  font-size: clamp(24px, 2.6vw, 30px);
  line-height: 1.15;
}

.page-section-caption {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.summary-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.summary-badge {
  display: grid;
  gap: 6px;
  min-width: 140px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.86);
  box-shadow: var(--app-shadow-soft);
}

.summary-badge span {
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-badge strong {
  font-size: 28px;
  line-height: 1;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.94fr) minmax(0, 1.3fr);
  gap: 16px;
  align-items: stretch;
}

.hero-panel {
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 24px;
  color: #f8fbff;
  background:
    radial-gradient(circle at top right, rgba(147, 197, 253, 0.22), transparent 26%),
    linear-gradient(145deg, #0f172a 0%, #1d4ed8 100%);
  box-shadow: 0 24px 44px rgba(37, 99, 235, 0.18);
}

.hero-kicker {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-value {
  font-size: clamp(40px, 5vw, 52px);
  line-height: 0.96;
  letter-spacing: -0.05em;
}

.hero-copy {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero-metric {
  display: grid;
  gap: 8px;
  min-height: 116px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

.hero-metric.warning {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(251, 191, 36, 0.26);
}

.hero-metric span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 1.6;
}

.hero-metric strong {
  margin-top: auto;
  font-size: 24px;
  line-height: 1.15;
}

.stage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.stage-card {
  display: grid;
  gap: 12px;
  min-height: 160px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background:
    linear-gradient(180deg, rgba(248, 251, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%),
    #ffffff;
}

.empty-stage-card {
  justify-items: start;
}

.stage-head {
  display: grid;
  gap: 10px;
}

.stage-label {
  color: var(--app-text-secondary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
}

.stage-head strong {
  display: block;
  margin-top: 6px;
  font-size: clamp(28px, 3vw, 34px);
  line-height: 1;
}

.stage-head small {
  color: var(--app-text-tertiary);
  line-height: 1.6;
}

.stage-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.stage-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--app-accent) 0%, #60a5fa 100%);
}

.stage-card p {
  margin: auto 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.signal-card {
  display: grid;
  gap: 8px;
  min-height: 124px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.72);
}

.signal-card span {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.signal-card strong {
  font-size: clamp(26px, 3vw, 32px);
  line-height: 1;
}

.signal-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .hero-metrics,
  .signal-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .overview-grid,
  .signal-grid {
    grid-template-columns: 1fr;
  }

  .summary-badges {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .summary-badge {
    width: 100%;
  }

  .hero-metrics,
  .stage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
