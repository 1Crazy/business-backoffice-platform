<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card overview-card">
    <div class="section-head">
      <div class="section-copy">
        <span class="page-kicker">销售概览</span>
        <h3 class="page-section-title">本期经营态势</h3>
        <p class="page-section-caption">把线索蓄水、商机推进、赢单结果和协同风险放在一处，帮助主管先看结果，再查阶段。</p>
      </div>
    </div>

    <div class="overview-grid">
      <article class="summary-primary-card">
        <span class="summary-kicker">经营结果</span>
        <h4 class="summary-title">本期赢单金额</h4>
        <strong class="summary-value">{{ formatAmount(overview?.wonAmount ?? 0) }}</strong>
        <p class="summary-copy">对应 {{ overview?.wonOpportunities ?? 0 }} 个已收口商机，作为当前筛选范围内的结果口径。</p>

        <div class="summary-inline-metrics">
          <article
            v-for="metric in resultAnchorMetrics"
            :key="metric.label"
            class="summary-inline-card"
          >
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>
      </article>

      <article class="summary-detail-card">
        <div class="summary-detail-head">
          <span class="summary-detail-kicker">结果质量</span>
          <p>结合回款和在途机会，快速判断当前结果的兑现质量。</p>
        </div>

        <div class="summary-detail-list">
          <article
            v-for="metric in highlightMetrics"
            :key="metric.label"
            class="summary-detail-row"
            :class="{ warning: metric.emphasis === 'warning' }"
          >
            <div class="summary-detail-copy">
              <span>{{ metric.label }}</span>
              <small>{{ metric.caption }}</small>
            </div>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>
      </article>

      <div class="stage-grid" :class="stageGridClasses">
        <template v-if="normalizedItems.length > 0">
          <article
            v-for="item in normalizedItems"
            :key="item.key"
            class="stage-card"
          >
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

      <div class="signal-grid">
        <article v-for="signal in signalMetrics" :key="signal.label" class="signal-card">
          <span>{{ signal.label }}</span>
          <strong>{{ signal.value }}</strong>
          <p>{{ signal.caption }}</p>
        </article>
      </div>
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

const resultAnchorMetrics = computed(() => [
  {
    label: "赢单商机",
    value: props.overview?.wonOpportunities ?? 0
  },
  {
    label: "商机赢单率",
    value: opportunityWinRate.value
  }
]);

const highlightMetrics = computed(() => [
  {
    label: "进行中商机金额",
    value: formatAmount(props.overview?.pipelineForecastAmount ?? 0),
    caption: "仍在推进中的商机储备。"
  },
  {
    label: "待收回款",
    value: formatAmount(props.overview?.receivableForecast.unreceivedAmount ?? 0),
    caption: "已计划但尚未回收的回款金额。"
  },
  {
    label: "逾期未回款",
    value: formatAmount(props.overview?.receivableForecast.overdueAmount ?? 0),
    caption: "已超过计划时间的高风险回款缺口。",
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

const stageGridClasses = computed(() => {
  const itemCount = normalizedItems.value.length;

  return {
    "stage-grid-remainder-4-1": itemCount > 0 && itemCount % 4 === 1,
    "stage-grid-remainder-4-2": itemCount > 0 && itemCount % 4 === 2,
    "stage-grid-remainder-4-3": itemCount > 0 && itemCount % 4 === 3,
    "stage-grid-remainder-3-1": itemCount > 0 && itemCount % 3 === 1,
    "stage-grid-remainder-3-2": itemCount > 0 && itemCount % 3 === 2,
    "stage-grid-remainder-2-1": itemCount > 0 && itemCount % 2 === 1
  };
});

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
  gap: 20px;
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

.overview-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.38fr);
  grid-template-areas:
    "primary stage"
    "detail signal";
  gap: 16px;
  align-items: start;
}

.summary-primary-card,
.summary-detail-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(255, 255, 255, 0.92));
  box-shadow: var(--app-shadow-soft);
}

.summary-primary-card {
  grid-area: primary;
  align-self: stretch;
  align-content: start;
  gap: 12px;
  grid-template-rows: auto auto auto 1fr auto;
}

.summary-kicker,
.summary-detail-kicker {
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.summary-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
}

.summary-value {
  font-size: clamp(34px, 4vw, 42px);
  line-height: 1;
  letter-spacing: -0.05em;
}

.summary-copy {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.summary-inline-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-inline-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.84);
}

.summary-inline-card span {
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.summary-inline-card strong {
  font-size: 24px;
  line-height: 1.15;
  color: var(--app-text-primary);
}

.summary-detail-head {
  display: grid;
  gap: 6px;
}

.summary-detail-card {
  grid-area: detail;
}

.summary-detail-head p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.summary-detail-list {
  display: grid;
  gap: 10px;
}

.summary-detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.84);
}

.summary-detail-row.warning {
  background: rgba(255, 247, 237, 0.92);
  border-color: rgba(245, 158, 11, 0.22);
}

.summary-detail-copy {
  display: grid;
  gap: 4px;
}

.summary-detail-copy span {
  color: var(--app-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.summary-detail-copy small {
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.summary-detail-row strong {
  font-size: 22px;
  line-height: 1.15;
  color: var(--app-text-primary);
}

.summary-detail-row.warning strong {
  color: #b45309;
}

.stage-grid {
  display: grid;
  grid-area: stage;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stage-card {
  display: grid;
  gap: 10px;
  min-height: 144px;
  padding: 16px;
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
  gap: 8px;
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
  font-size: 12px;
  line-height: 1.6;
}

.signal-grid {
  display: grid;
  grid-area: signal;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

@media (min-width: 1181px) {
  .stage-grid.stage-grid-remainder-4-1 .stage-card:last-child {
    grid-column: span 4;
  }

  .stage-grid.stage-grid-remainder-4-2 .stage-card:nth-last-child(-n + 2) {
    grid-column: span 2;
  }

  .stage-grid.stage-grid-remainder-4-3 .stage-card:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 1180px) {
  .stage-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stage-grid.stage-grid-remainder-3-1 .stage-card:last-child {
    grid-column: span 3;
  }

  .stage-grid.stage-grid-remainder-3-2 .stage-card:last-child {
    grid-column: span 2;
  }

}

@media (max-width: 960px) {
  .overview-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "primary"
      "detail"
      "stage"
      "signal";
  }

  .summary-inline-metrics,
  .stage-grid {
    grid-template-columns: 1fr;
  }

  .stage-grid.stage-grid-remainder-2-1 .stage-card:last-child {
    grid-column: auto;
  }
}

@media (max-width: 1180px) and (min-width: 961px) {
  .overview-grid {
    grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  }
}

@media (max-width: 960px) and (min-width: 641px) {
  .stage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stage-grid.stage-grid-remainder-2-1 .stage-card:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .stage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
