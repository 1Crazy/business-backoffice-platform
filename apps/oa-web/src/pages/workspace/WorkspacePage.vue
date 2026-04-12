<!-- 工作台页面：负责组装 OA 摘要卡片、快捷入口和最近公告，并在当前上下文中展开公告详情。 -->
<template>
  <div class="workspace-shell">
    <WorkspaceLoadingState v-if="isLoading" />
    <template v-else>
      <WorkspaceHeroSection :overview="overview" :metric-cards="metricCards" />
      <WorkspaceOverviewPanels
        :focus-items="focusItems"
        :recent-announcements="overview.recentAnnouncements"
        @open-announcement="openAnnouncementDetail"
      />
      <AnnouncementDetailDrawer
        v-model:visible="drawerVisible"
        :announcement="announcement"
        :is-loading="isAnnouncementLoading"
        :is-tablet-or-down="isTabletOrDown"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useAnnouncementDetailDrawer } from "@/composables/announcements/useAnnouncementDetailDrawer";
import AnnouncementDetailDrawer from "@/pages/announcements/components/AnnouncementDetailDrawer.vue";
import WorkspaceHeroSection from "@/pages/workspace/components/WorkspaceHeroSection.vue";
import WorkspaceLoadingState from "@/pages/workspace/components/WorkspaceLoadingState.vue";
import WorkspaceOverviewPanels from "@/pages/workspace/components/WorkspaceOverviewPanels.vue";
import { useWorkspacePage } from "@/composables/workspace/useWorkspacePage";

const { overview, isLoading } = useWorkspacePage();
const {
  announcement,
  drawerVisible,
  isLoading: isAnnouncementLoading,
  isTabletOrDown,
  openAnnouncementDetail
} = useAnnouncementDetailDrawer();

const metricCards = computed(() => [
  {
    label: "全部待我审批",
    value: overview.value.pendingApprovalCount
  },
  {
    label: "行政待我审批",
    value: overview.value.administrativeRequestPendingCount
  },
  {
    label: "全部我发起的申请",
    value: overview.value.myRequestCount
  },
  {
    label: "我的行政申请",
    value: overview.value.administrativeRequestMyCount
  }
]);

const focusItems = computed(() => [
  {
    title: "行政待我审批",
    value: `${overview.value.administrativeRequestPendingCount} 项`,
    caption: overview.value.administrativeRequestPendingCount > 0 ? "优先进入行政审批处理。" : "当前没有待处理行政审批。"
  },
  {
    title: "我的行政申请",
    value: `${overview.value.administrativeRequestMyCount} 项`,
    caption: overview.value.administrativeRequestMyCount > 0 ? "可回看最近申请进度与审批意见。" : "暂无进行中的行政申请。"
  },
  {
    title: "公告同步",
    value: `${overview.value.activeAnnouncementCount} 条`,
    caption: overview.value.activeAnnouncementCount > 0 ? "查看最近组织通知。" : "当前无新公告。"
  }
]);
</script>

<style scoped>
.workspace-shell {
  display: grid;
  gap: 18px;
}
</style>
