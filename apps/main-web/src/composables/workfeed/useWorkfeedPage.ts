import { ElMessage } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useWorkfeedData } from "@/composables/workfeed/useWorkfeed";
import { useWorkfeedPreferences } from "@/composables/workfeed/useWorkfeedPreferences";
import {
  buildDomainOptions,
  buildNotificationTypeOptions,
  buildPriorityOptions,
  buildTodoTypeOptions,
  type DrawerEntry,
  type DrawerEntryKind,
  type WorkfeedTab
} from "@/pages/workfeed/workfeed-helpers";
import {
  type ListWorkfeedNotificationsParams,
  type ListWorkfeedTodosParams,
  type WorkfeedChannel,
  type WorkfeedDigestMode,
  type WorkfeedNotification,
  type WorkfeedNotificationType,
  type WorkfeedTodo
} from "@/types/workfeed";

const SUBSCRIPTION_CARD_DEFINITIONS: Array<{
  key: WorkfeedNotificationType;
  label: string;
  caption: string;
  helperText?: string;
}> = [
  {
    key: "LEAVE_RESULT",
    label: "审批结果",
    caption: "结果",
    helperText: "覆盖请假结果与行政结果。"
  },
  {
    key: "CUSTOMER_REMINDER",
    label: "跟进提醒",
    caption: "提醒",
    helperText: "覆盖客户提醒与线索提醒。"
  },
  {
    key: "RENEWAL_REMINDER",
    label: "续费提醒",
    caption: "提醒"
  },
  {
    key: "ANNOUNCEMENT",
    label: "公告摘要",
    caption: "公告"
  }
] as const;

export function useWorkfeedPage() {
  const router = useRouter();
  const activeTab = ref<WorkfeedTab>("todos");
  const todoFilters = ref<ListWorkfeedTodosParams>({});
  const notificationFilters = ref<ListWorkfeedNotificationsParams>({ unreadOnly: false });
  const drawerVisible = ref(false);
  const selectedEntry = ref<DrawerEntry | null>(null);
  const selectedEntryKind = ref<DrawerEntryKind>("todo");
  const skipNextTodoAutoSearch = ref(false);
  const skipNextNotificationAutoSearch = ref(false);

  const {
    todos,
    notifications,
    loadingTodos,
    loadingNotifications,
    loadTodos,
    loadNotifications,
    markNotificationAsRead
  } = useWorkfeedData();
  const {
    preferences,
    enabledChannelCount,
    loadPreferences,
    loadingPreferences,
    resetPreferences,
    savingPreferences,
    setDigestMode,
    setEscalationHours,
    toggleChannel,
    toggleSubscription
  } = useWorkfeedPreferences();

  const unreadCount = computed(() => (Array.isArray(notifications.value) ? notifications.value : []).filter((item) => !item.isRead).length);
  const domainOptions = computed(() => buildDomainOptions());
  const todoTypeOptions = computed(() => buildTodoTypeOptions());
  const notificationTypeOptions = computed(() => buildNotificationTypeOptions());
  const priorityOptions = computed(() => buildPriorityOptions());
  const channelItems = computed(() => [
    {
      key: "IN_APP" as const,
      label: "站内消息",
      caption: "默认",
      enabled: preferences.value.channels.IN_APP,
      locked: true
    },
    {
      key: "EMAIL" as const,
      label: "邮件",
      caption: "外部",
      enabled: preferences.value.channels.EMAIL
    },
    {
      key: "ENTERPRISE_IM" as const,
      label: "企业即时通讯（IM）",
      caption: "协同",
      enabled: preferences.value.channels.ENTERPRISE_IM
    }
  ]);
  const subscriptionItems = computed(() =>
    SUBSCRIPTION_CARD_DEFINITIONS.map((item) => ({
      key: item.key,
      label: item.label,
      caption: item.caption,
      enabled: preferences.value.subscriptions[item.key],
      helperText: item.helperText
    }))
  );
  const enabledSubscriptionCardCount = computed(() => subscriptionItems.value.filter((item) => item.enabled).length);
  const preferencePanelDisabled = computed(() => loadingPreferences.value || savingPreferences.value);

  function buildTodoQuery(): ListWorkfeedTodosParams {
    return {
      domain: todoFilters.value.domain || undefined,
      type: todoFilters.value.type || undefined,
      priority: todoFilters.value.priority || undefined
    };
  }

  function buildNotificationQuery(): ListWorkfeedNotificationsParams {
    return {
      domain: notificationFilters.value.domain || undefined,
      type: notificationFilters.value.type || undefined,
      unreadOnly: notificationFilters.value.unreadOnly ?? false
    };
  }

  function setActiveTab(value: WorkfeedTab): void {
    activeTab.value = value;
  }

  function updateTodoFilters(nextFilters: ListWorkfeedTodosParams): void {
    todoFilters.value = nextFilters;
  }

  function updateNotificationFilters(nextFilters: ListWorkfeedNotificationsParams): void {
    notificationFilters.value = nextFilters;
  }

  function resetTodoFilters(): void {
    skipNextTodoAutoSearch.value = true;
    todoFilters.value = {};
    void loadTodos();
  }

  function resetNotificationFilters(): void {
    skipNextNotificationAutoSearch.value = true;
    notificationFilters.value = { unreadOnly: false };
    void loadNotifications({ unreadOnly: false });
  }

  function openTodoDrawer(todo: WorkfeedTodo): void {
    selectedEntry.value = todo;
    selectedEntryKind.value = "todo";
    drawerVisible.value = true;
  }

  function openNotificationDrawer(notification: WorkfeedNotification): void {
    selectedEntry.value = notification;
    selectedEntryKind.value = "notification";
    drawerVisible.value = true;
  }

  function closeDrawer(): void {
    drawerVisible.value = false;
  }

  async function navigateFromDrawer(): Promise<void> {
    if (!selectedEntry.value) {
      return;
    }

    if (selectedEntryKind.value === "notification") {
      const notification = selectedEntry.value as WorkfeedNotification;

      if (!notification.isRead) {
        await markNotificationAsRead(notification);
      }
    }

    drawerVisible.value = false;
    await router.push(selectedEntry.value.targetPath);
  }

  function onToggleChannel(channel: WorkfeedChannel): void {
    toggleChannel(channel);
  }

  function onLockedChannel(channel: WorkfeedChannel): void {
    if (channel === "IN_APP") {
      ElMessage.info("站内消息是基础通知渠道，当前版本固定开启。");
    }
  }

  function onToggleSubscription(type: WorkfeedNotificationType): void {
    toggleSubscription(type);
  }

  function onSetDigestMode(mode: WorkfeedDigestMode): void {
    setDigestMode(mode);
  }

  function onSetEscalationHours(hours: number): void {
    setEscalationHours(hours);
  }

  onMounted(() => {
    void loadTodos();
    void loadNotifications();
    void loadPreferences();
  });

  watch(
    todoFilters,
    () => {
      if (skipNextTodoAutoSearch.value) {
        skipNextTodoAutoSearch.value = false;
        return;
      }

      void loadTodos(buildTodoQuery());
    },
    { deep: true }
  );

  watch(
    notificationFilters,
    () => {
      if (skipNextNotificationAutoSearch.value) {
        skipNextNotificationAutoSearch.value = false;
        return;
      }

      void loadNotifications(buildNotificationQuery());
    },
    { deep: true }
  );

  return {
    activeTab,
    channelItems,
    closeDrawer,
    domainOptions,
    drawerVisible,
    enabledChannelCount,
    enabledSubscriptionCount: enabledSubscriptionCardCount,
    loadingNotifications,
    loadingPreferences,
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
    savingPreferences,
    setActiveTab,
    subscriptionItems,
    todoFilters,
    todoTypeOptions,
    todos,
    unreadCount,
    updateNotificationFilters,
    updateTodoFilters,
    navigateFromDrawer
  };
}
