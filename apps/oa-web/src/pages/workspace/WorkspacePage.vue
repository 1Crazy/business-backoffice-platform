<!-- 工作台页面：负责组装 OA 摘要卡片、快捷入口和最近公告，并在当前上下文中展开公告详情。 -->
<template>
  <div class="workspace-shell">
    <WorkspaceLoadingState v-if="isLoading" />
    <template v-else>
      <WorkspaceHeroSection
        :overview="overview"
        :metric-cards="metricCards"
        :template-cards="templateCards"
        :workfeed-entry-href="workfeedEntryHref"
      />
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
import { getHostAppPath } from "@/utils/host-navigation";

const { overview, isLoading, templateCards } = useWorkspacePage();
const {
  announcement,
  drawerVisible,
  isLoading: isAnnouncementLoading,
  isTabletOrDown,
  openAnnouncementDetail
} = useAnnouncementDetailDrawer();
const workfeedEntryHref = getHostAppPath("/workfeed");

const metricCards = computed(() => [
  {
    label: "全部待办",
    value: overview.value.pendingApprovalCount
  },
  {
    label: "我的申请",
    value: overview.value.myRequestCount
  },
  {
    label: "公告",
    value: overview.value.activeAnnouncementCount
  },
  {
    label: "部门",
    value: overview.value.directoryDepartmentCount
  }
]);

const focusItems = computed(() => [
  {
    title: "待我审批",
    value: `${overview.value.pendingApprovalCount} 项`,
    caption: overview.value.pendingApprovalCount > 0 ? "统一处理" : "当前为空"
  },
  {
    title: "我发起的申请",
    value: `${overview.value.myRequestCount} 项`,
    caption: overview.value.myRequestCount > 0 ? "状态跟踪" : "当前为空"
  },
  {
    title: "行政待审",
    value: `${overview.value.administrativeRequestPendingCount} 项`,
    caption: overview.value.administrativeRequestPendingCount > 0 ? "高频流程" : "当前为空"
  },
  {
    title: "公告同步",
    value: `${overview.value.activeAnnouncementCount} 条`,
    caption: overview.value.activeAnnouncementCount > 0 ? "最近发布" : "当前为空"
  }
]);
</script>

<style scoped>
.workspace-shell {
  display: grid;
  gap: 18px;
}
</style>
