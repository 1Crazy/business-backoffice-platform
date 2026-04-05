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

    <section class="page-card scope-card">
      <div>
        <span class="scope-kicker">Metrics / Unified Scope</span>
        <h3>统计口径提示</h3>
        <p>客户、线索、跟进和提醒都按照同一数据范围规则收口，所以看板与业务列表的数字应该互相对得上。</p>
      </div>
      <ul class="scope-list">
        <li>如果你和主管看到的数据不同，通常是角色数据范围不同，而不是统计口径不一致。</li>
        <li v-if="isOverviewEmpty">当前时间范围和数据范围下暂无业务数据，可以切换日期或确认账号权限范围。</li>
        <li v-else>当前周期内已有数据，列表页筛选相同条件后应能复现这些统计结果。</li>
      </ul>
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
const isOverviewEmpty = computed(
  () =>
    Boolean(overview.value) &&
    [
      overview.value?.newCustomers ?? 0,
      overview.value?.followUpCount ?? 0,
      overview.value?.convertedLeads ?? 0,
      overview.value?.totalLeads ?? 0,
      overview.value?.pendingReminders ?? 0
    ].every((value) => value === 0)
);

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

.scope-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background:
    linear-gradient(135deg, rgba(30, 64, 175, 0.06), transparent 42%),
    linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent 58%),
    #ffffff;
}

.scope-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: #1e40af;
  font-size: 12px;
  font-family: "Fira Code", monospace;
  letter-spacing: 0.04em;
}

.scope-card h3 {
  margin: 0 0 8px;
}

.scope-card p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.scope-list {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
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
  .scope-card,
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
