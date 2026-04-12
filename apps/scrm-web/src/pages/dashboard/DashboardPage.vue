<!-- dashboard 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="dashboard">
    <template v-if="isLoading">
      <section class="page-card dashboard-skeleton">
        <span class="ui-skeleton ui-skeleton-pill" />
        <span class="ui-skeleton ui-skeleton-line long skeleton-title" />
        <span class="ui-skeleton ui-skeleton-line medium" />
        <div class="skeleton-chip-row">
          <span v-for="item in 3" :key="item" class="ui-skeleton ui-skeleton-pill" />
        </div>
        <span class="ui-skeleton ui-skeleton-line medium skeleton-picker" />
      </section>

      <section class="page-card dashboard-skeleton dual-column">
        <div class="skeleton-stack">
          <span class="ui-skeleton ui-skeleton-pill" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <span class="ui-skeleton ui-skeleton-line medium" />
        </div>
        <div class="skeleton-stack">
          <span class="ui-skeleton ui-skeleton-line long" />
          <span class="ui-skeleton ui-skeleton-line long" />
        </div>
      </section>

      <section class="stats-skeleton-grid">
        <article v-for="item in 5" :key="item" class="page-card dashboard-skeleton stat-skeleton-card">
          <span class="ui-skeleton ui-skeleton-line short" />
          <span class="ui-skeleton ui-skeleton-line medium skeleton-value" />
          <span class="ui-skeleton ui-skeleton-line long" />
        </article>
      </section>

      <section class="page-card dashboard-skeleton">
        <span class="ui-skeleton ui-skeleton-pill" />
        <span class="ui-skeleton ui-skeleton-line medium" />
        <div class="stats-skeleton-grid">
          <article v-for="item in 3" :key="`insight-${item}`" class="insight-skeleton-card">
            <span class="ui-skeleton ui-skeleton-line short" />
            <span class="ui-skeleton ui-skeleton-line medium skeleton-value" />
            <span class="ui-skeleton ui-skeleton-line long" />
          </article>
        </div>
      </section>
    </template>

    <template v-else>
      <DashboardToolbarSection
        v-model:date-range="dateRange"
        v-model:department-id="selectedDepartmentId"
        v-model:owner-id="selectedOwnerId"
        :departments="departmentOptions"
        :owners="ownerOptions"
        :refreshing="isRefreshing"
        @change="loadOverview"
        @reset="resetOverviewFilters"
      />
      <DashboardStatsSection :cards="cards" />
      <DashboardSalesOverviewSection :items="salesFunnel" :overview="overview" />
      <DashboardRankingSection
        :owner-ranking="ownerPerformanceRanking"
        :department-ranking="departmentPerformanceRanking"
      />
      <DashboardScopeSection
        :is-overview-empty="isOverviewEmpty"
        :department-name="selectedDepartmentName"
        :owner-name="selectedOwnerName"
        :department-count="departmentOptions.length"
        :owner-count="ownerOptions.length"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import DashboardSalesOverviewSection from "@/pages/dashboard/components/DashboardFunnelSection.vue";
import DashboardRankingSection from "@/pages/dashboard/components/DashboardRankingSection.vue";
import DashboardScopeSection from "@/pages/dashboard/components/DashboardScopeSection.vue";
import DashboardStatsSection from "@/pages/dashboard/components/DashboardStatsSection.vue";
import DashboardToolbarSection from "@/pages/dashboard/components/DashboardToolbarSection.vue";
import { useDashboardOverview } from "@/composables/dashboard/useDashboardOverview";

const {
  cards,
  dateRange,
  departmentOptions,
  departmentPerformanceRanking,
  isLoading,
  isOverviewEmpty,
  isRefreshing,
  loadOverview,
  overview,
  ownerOptions,
  ownerPerformanceRanking,
  salesFunnel,
  resetOverviewFilters,
  selectedDepartmentId,
  selectedDepartmentName,
  selectedOwnerId,
  selectedOwnerName
} = useDashboardOverview();
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 20px;
}

.dashboard-skeleton,
.stats-skeleton-grid,
.skeleton-stack {
  display: grid;
  gap: 12px;
}

.dual-column {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.92fr);
  align-items: start;
}

.stats-skeleton-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.skeleton-title {
  height: 32px;
  border-radius: 16px;
}

.skeleton-picker {
  width: 280px;
  height: 40px;
  border-radius: 14px;
}

.skeleton-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skeleton-value {
  height: 28px;
  width: 42%;
  border-radius: 14px;
}

.stat-skeleton-card,
.insight-skeleton-card {
  display: grid;
  gap: 12px;
}

.insight-skeleton-card {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.82);
}

@media (max-width: 960px) {
  .dual-column,
  .stats-skeleton-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-picker {
    width: 100%;
  }
}
</style>
