<template>
  <div class="dashboard">
    <section class="page-card toolbar">
      <div>
        <h2>运营看板</h2>
        <p>默认统计最近 30 天，并按当前账号的数据权限范围收口。</p>
      </div>
      <el-date-picker
        v-model="dateRange"
        class="toolbar-picker"
        type="daterange"
        unlink-panels
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="loadOverview"
      />
    </section>

    <div class="stats-grid">
      <article class="page-card stat-card" v-for="card in cards" :key="card.label">
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-value">{{ card.value }}</div>
        <div class="stat-caption">{{ card.caption }}</div>
      </article>
    </div>

    <section class="page-card intro-card">
      <div>
        <h2>数据解读</h2>
        <p>
          这个区域保留给销售主管快速判断节奏：客户新增、线索转化、跟进次数和待办提醒都放在同一层级，减少来回切页。
        </p>
      </div>
      <ul class="insight-list">
        <li>线索总量：{{ overview?.totalLeads ?? 0 }}</li>
        <li>已转客户：{{ overview?.convertedLeads ?? 0 }}</li>
        <li>待办提醒：{{ overview?.pendingReminders ?? 0 }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { http } from "../api/http";
import type { DashboardOverview } from "../types/entities";

const dateRange = ref<[string, string] | []>([]);
const overview = ref<DashboardOverview | null>(null);

const cards = computed(() => [
  {
    label: "新增客户",
    value: overview.value?.newCustomers ?? "--",
    caption: "统计周期内新增的客户档案数"
  },
  {
    label: "跟进次数",
    value: overview.value?.followUpCount ?? "--",
    caption: "统计周期内新建的跟进记录数"
  },
  {
    label: "线索转化率",
    value: overview.value ? `${overview.value.conversionRate}%` : "--",
    caption: "已转客户线索 / 周期内线索总数"
  }
]);

async function loadOverview(): Promise<void> {
  const [startDate, endDate] = dateRange.value;
  const { data } = await http.get<DashboardOverview>("/dashboard/overview", {
    params: {
      startDate,
      endDate
    }
  });

  overview.value = data;
}

onMounted(() => {
  void loadOverview();
});
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-picker {
  width: 340px;
  max-width: 100%;
}

.toolbar h2 {
  margin: 0 0 6px;
}

.toolbar p {
  margin: 0;
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: "";
  position: absolute;
  inset: auto -30px -60px auto;
  width: 140px;
  height: 140px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
}

.stat-label {
  color: #64748b;
}

.stat-value {
  margin-top: 10px;
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
}

.stat-caption {
  margin-top: 6px;
  color: #94a3b8;
}

.intro-card h2 {
  margin: 0 0 10px;
}

.intro-card p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.intro-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.insight-list {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.9;
}

@media (max-width: 960px) {
  .toolbar,
  .intro-card {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-picker {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
