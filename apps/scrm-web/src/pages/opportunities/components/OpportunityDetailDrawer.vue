<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-drawer v-model="drawerVisible" title="商机详情" :size="isTabletOrDown ? '100%' : '680px'" append-to-body>
    <template v-if="opportunity">
      <div class="drawer-stack">
        <OpportunitySummarySection :opportunity="opportunity" />
        <OpportunityRevenueSection :opportunity="opportunity" @open-revenue-workspace="openRevenueWorkspace" />
        <OpportunityTimelineSection :stage-history="opportunity.stageHistory ?? []" />
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import type { Opportunity } from "@/types/opportunities";
import OpportunityRevenueSection from "@/pages/opportunities/components/OpportunityRevenueSection.vue";
import OpportunitySummarySection from "@/pages/opportunities/components/OpportunitySummarySection.vue";
import OpportunityTimelineSection from "@/pages/opportunities/components/OpportunityTimelineSection.vue";

const router = useRouter();

const props = defineProps<{
  visible: boolean;
  opportunity: Opportunity | null;
  isTabletOrDown: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});

function openRevenueWorkspace(): void {
  if (!props.opportunity || props.opportunity.resultStatus !== "WON") {
    return;
  }

  void router.push({
    path: "/revenue-operations",
    query: {
      customerId: props.opportunity.customerId,
      opportunityId: props.opportunity.id
    }
  });
}
</script>

<style scoped>
.drawer-stack {
  display: grid;
  gap: 20px;
}
</style>
