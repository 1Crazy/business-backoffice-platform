<template>
  <div class="dashboard">
    <DashboardToolbarSection v-model="dateRange" @change="loadOverview" />
    <DashboardScopeSection :is-overview-empty="isOverviewEmpty" />
    <DashboardStatsSection :cards="cards" />
    <DashboardInsightSection :overview="overview" />
  </div>
</template>

<script setup lang="ts">
import DashboardInsightSection from "@/pages/dashboard/components/DashboardInsightSection.vue";
import DashboardScopeSection from "@/pages/dashboard/components/DashboardScopeSection.vue";
import DashboardStatsSection from "@/pages/dashboard/components/DashboardStatsSection.vue";
import DashboardToolbarSection from "@/pages/dashboard/components/DashboardToolbarSection.vue";
import { useDashboardOverview } from "@/composables/dashboard/useDashboardOverview";

const { cards, dateRange, isOverviewEmpty, loadOverview, overview } = useDashboardOverview();
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 20px;
}
</style>
