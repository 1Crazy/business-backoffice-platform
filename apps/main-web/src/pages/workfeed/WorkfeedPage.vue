<template>
  <section class="workfeed-page">
    <WorkfeedHeroSection
      :todo-count="todos.length"
      :notification-count="notifications.length"
      :unread-count="unreadCount"
    />

    <WorkfeedFeedSection
      :active-tab="activeTab"
      :todo-filters="todoFilters"
      :notification-filters="notificationFilters"
      :domain-options="domainOptions"
      :todo-type-options="todoTypeOptions"
      :notification-type-options="notificationTypeOptions"
      :priority-options="priorityOptions"
      :todos="todos"
      :notifications="notifications"
      :loading-todos="loadingTodos"
      :loading-notifications="loadingNotifications"
      @update:active-tab="setActiveTab"
      @update:todo-filters="updateTodoFilters"
      @update:notification-filters="updateNotificationFilters"
      @reset-todos="resetTodoFilters"
      @reset-notifications="resetNotificationFilters"
      @open-todo="openTodoDrawer"
      @open-notification="openNotificationDrawer"
    />

    <WorkfeedPreferencePanel
      :channel-items="channelItems"
      :subscription-items="subscriptionItems"
      :digest-mode="preferences.digestMode"
      :escalation-hours="preferences.escalationHours"
      :enabled-channel-count="enabledChannelCount"
      :enabled-subscription-count="enabledSubscriptionCount"
      :disabled="preferencePanelDisabled"
      @reset="resetPreferences"
      @locked-channel="onLockedChannel"
      @toggle-channel="onToggleChannel"
      @toggle-subscription="onToggleSubscription"
      @update:digest-mode="onSetDigestMode"
      @update:escalation-hours="onSetEscalationHours"
    />

    <WorkfeedEntryDrawer
      :visible="drawerVisible"
      :entry="selectedEntry"
      :entry-kind="selectedEntryKind"
      @close="closeDrawer"
      @navigate="navigateFromDrawer"
    />
  </section>
</template>

<script setup lang="ts">
import { useWorkfeedPage } from "@/composables/workfeed/useWorkfeedPage";
import WorkfeedEntryDrawer from "@/pages/workfeed/components/WorkfeedEntryDrawer.vue";
import WorkfeedFeedSection from "@/pages/workfeed/components/WorkfeedFeedSection.vue";
import WorkfeedHeroSection from "@/pages/workfeed/components/WorkfeedHeroSection.vue";
import WorkfeedPreferencePanel from "@/pages/workfeed/components/WorkfeedPreferencePanel.vue";
const {
  activeTab,
  channelItems,
  closeDrawer,
  domainOptions,
  drawerVisible,
  enabledChannelCount,
  enabledSubscriptionCount,
  loadingNotifications,
  loadingTodos,
  notificationFilters,
  notificationTypeOptions,
  notifications,
  onLockedChannel,
  onSetDigestMode,
  onSetEscalationHours,
  onToggleChannel,
  onToggleSubscription,
  openNotificationDrawer,
  openTodoDrawer,
  preferences,
  preferencePanelDisabled,
  priorityOptions,
  resetNotificationFilters,
  resetPreferences,
  resetTodoFilters,
  selectedEntry,
  selectedEntryKind,
  setActiveTab,
  subscriptionItems,
  todoFilters,
  todoTypeOptions,
  todos,
  unreadCount,
  updateNotificationFilters,
  updateTodoFilters,
  navigateFromDrawer
} = useWorkfeedPage();
</script>

<style scoped>
.workfeed-page {
  display: grid;
  gap: 20px;
}
</style>
