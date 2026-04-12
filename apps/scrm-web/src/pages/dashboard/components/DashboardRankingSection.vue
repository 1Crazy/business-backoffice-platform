<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="ranking-grid">
    <article class="page-card ranking-card">
      <span class="page-kicker">负责人排行</span>
      <h3 class="page-section-title">个人业绩摘要</h3>
      <p class="page-section-caption">按赢单金额、已回款金额和赢单数综合排序，帮助识别当前经营主力。</p>

      <div class="ranking-list">
        <div v-for="(item, index) in ownerRanking" :key="item.id" class="ranking-row">
          <div class="ranking-index">0{{ index + 1 }}</div>
          <div class="ranking-copy">
            <strong>{{ item.label }}</strong>
            <span>{{ item.departmentName ?? "未分配团队" }}</span>
          </div>
          <div class="ranking-metric">
            <strong>{{ formatAmount(item.wonAmount) }}</strong>
            <span>{{ item.wonOpportunities }} 个赢单 / {{ formatAmount(item.receivedAmount) }} 回款</span>
          </div>
        </div>
      </div>
    </article>

    <article class="page-card ranking-card">
      <span class="page-kicker">团队排行</span>
      <h3 class="page-section-title">团队业绩摘要</h3>
      <p class="page-section-caption">按团队维度聚合赢单、回款和新增客户，便于对比不同团队的经营节奏。</p>

      <div class="ranking-list">
        <div v-for="(item, index) in departmentRanking" :key="item.id" class="ranking-row">
          <div class="ranking-index">0{{ index + 1 }}</div>
          <div class="ranking-copy">
            <strong>{{ item.label }}</strong>
            <span>{{ item.newCustomers }} 个新增客户</span>
          </div>
          <div class="ranking-metric">
            <strong>{{ formatAmount(item.wonAmount) }}</strong>
            <span>{{ item.wonOpportunities }} 个赢单 / {{ formatAmount(item.receivedAmount) }} 回款</span>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { DashboardRankingItem } from "@/types/dashboard";
import { formatAmount } from "@/utils/display";

defineProps<{
  ownerRanking: DashboardRankingItem[];
  departmentRanking: DashboardRankingItem[];
}>();
</script>

<style scoped>
.ranking-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.ranking-card {
  display: grid;
  gap: 16px;
}

.ranking-list {
  display: grid;
  gap: 10px;
}

.ranking-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(248, 251, 255, 0.86);
  border: 1px solid rgba(95, 125, 170, 0.14);
}

.ranking-index {
  color: rgba(37, 99, 235, 0.72);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.ranking-copy,
.ranking-metric {
  display: grid;
  gap: 4px;
}

.ranking-copy strong,
.ranking-metric strong {
  color: var(--app-text-primary);
}

.ranking-copy span,
.ranking-metric span {
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.ranking-metric {
  justify-items: end;
  text-align: right;
}

@media (max-width: 960px) {
  .ranking-grid {
    grid-template-columns: 1fr;
  }

  .ranking-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .ranking-metric {
    grid-column: 2;
    justify-items: start;
    text-align: left;
  }
}
</style>
