<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card intro-card">
    <div>
      <h2>数据解读</h2>
      <p>这个区域保留给销售主管快速判断节奏：客户新增、线索转化、跟进次数和待办提醒都放在同一层级，减少来回切页。</p>
    </div>
    <ul class="insight-list">
      <li>线索总量：{{ overview?.totalLeads ?? 0 }}</li>
      <li>已转客户：{{ overview?.convertedLeads ?? 0 }}</li>
      <li>待办提醒：{{ overview?.pendingReminders ?? 0 }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { DashboardOverview } from "@/types/dashboard";

defineProps<{
  overview: DashboardOverview | null;
}>();
</script>

<style scoped>
.intro-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.intro-card h2 {
  margin: 0 0 10px;
}

.intro-card p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.insight-list {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.9;
}

@media (max-width: 960px) {
  .intro-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
