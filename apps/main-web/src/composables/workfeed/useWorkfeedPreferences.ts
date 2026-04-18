import { ElMessage } from "element-plus";
import { computed, ref } from "vue";

import { fetchNotificationPreferences, updateNotificationPreferences } from "@/api/notification-center.api";
import type {
  NotificationPreferenceRecord,
  WorkfeedChannel,
  WorkfeedDigestMode,
  WorkfeedNotificationType,
  WorkfeedPreferenceState
} from "@/types/workfeed";
import { NOTIFICATION_TYPES } from "@/types/workfeed";

const UI_TO_BACKEND_EVENT_MAP: Record<
  WorkfeedNotificationType,
  Array<Pick<NotificationPreferenceRecord, "domain" | "eventType">>
> = {
  LEAVE_RESULT: [{ domain: "OA", eventType: "WORKFLOW_RESULT" }],
  ADMINISTRATIVE_RESULT: [{ domain: "OA", eventType: "WORKFLOW_RESULT" }],
  CUSTOMER_REMINDER: [{ domain: "SCRM", eventType: "FOLLOW_UP_REMINDER" }],
  LEAD_REMINDER: [{ domain: "SCRM", eventType: "FOLLOW_UP_REMINDER" }],
  RENEWAL_REMINDER: [{ domain: "SCRM", eventType: "RENEWAL_REMINDER" }],
  ANNOUNCEMENT: [{ domain: "OA", eventType: "ANNOUNCEMENT" }]
};

function buildPreferenceMappingKey(mapping: Pick<NotificationPreferenceRecord, "domain" | "eventType">): string {
  return `${mapping.domain}:${mapping.eventType}`;
}

function getLinkedSubscriptionTypes(type: WorkfeedNotificationType): WorkfeedNotificationType[] {
  const targetKeys = new Set(UI_TO_BACKEND_EVENT_MAP[type].map((item) => buildPreferenceMappingKey(item)));

  return NOTIFICATION_TYPES.filter((candidate) =>
    UI_TO_BACKEND_EVENT_MAP[candidate].some((item) => targetKeys.has(buildPreferenceMappingKey(item)))
  );
}

function createDefaultState(): WorkfeedPreferenceState {
  return {
    channels: {
      IN_APP: true,
      EMAIL: false,
      ENTERPRISE_IM: false
    },
    subscriptions: Object.fromEntries(NOTIFICATION_TYPES.map((item) => [item, true])) as Record<
      WorkfeedNotificationType,
      boolean
    >,
    digestMode: "IMMEDIATE",
    escalationHours: 8
  };
}

function pickPrimaryPreference(records: NotificationPreferenceRecord[]) {
  return records.find((item) => item.domain === "OA" && item.eventType === "WORKFLOW_RESULT") ?? records[0] ?? null;
}

function buildRecordMap(records: NotificationPreferenceRecord[]) {
  return new Map(records.map((item) => [buildPreferenceMappingKey(item), item]));
}

function resolveUiSubscriptionState(
  type: WorkfeedNotificationType,
  recordMap: Map<string, NotificationPreferenceRecord>
): boolean {
  const records = UI_TO_BACKEND_EVENT_MAP[type]
    .map((item) => recordMap.get(buildPreferenceMappingKey(item)))
    .filter((item): item is NotificationPreferenceRecord => Boolean(item));

  if (!records.length) {
    return true;
  }

  return records.every((item) => item.subscribed);
}

function toPreferenceState(records: NotificationPreferenceRecord[]): WorkfeedPreferenceState {
  if (!records.length) {
    return createDefaultState();
  }

  const recordMap = buildRecordMap(records);
  const primaryPreference = pickPrimaryPreference(records);

  return {
    channels: {
      IN_APP: true,
      EMAIL: records.every((item) => item.emailEnabled),
      ENTERPRISE_IM: records.every((item) => item.enterpriseImEnabled)
    },
    subscriptions: Object.fromEntries(
      NOTIFICATION_TYPES.map((type) => [type, resolveUiSubscriptionState(type, recordMap)])
    ) as Record<WorkfeedNotificationType, boolean>,
    digestMode: primaryPreference?.digestMode ?? "IMMEDIATE",
    escalationHours: Math.max(1, Math.round((primaryPreference?.nudgeThresholdMinutes ?? 480) / 60))
  };
}

function toUpsertPayload(state: WorkfeedPreferenceState, records: NotificationPreferenceRecord[]) {
  return {
    preferences: records.map((item) => {
      const subscriptionKeys = NOTIFICATION_TYPES.filter((type) =>
        UI_TO_BACKEND_EVENT_MAP[type].some(
          (mapping) => mapping.domain === item.domain && mapping.eventType === item.eventType
        )
      );
      const subscribed = subscriptionKeys.length
        ? subscriptionKeys.every((type) => state.subscriptions[type])
        : item.subscribed;

      return {
        domain: item.domain,
        eventType: item.eventType,
        subscribed,
        emailEnabled: state.channels.EMAIL,
        enterpriseImEnabled: state.channels.ENTERPRISE_IM,
        digestMode: state.digestMode,
        reminderFrequencyMinutes: item.reminderFrequencyMinutes ?? null,
        nudgeThresholdMinutes: state.escalationHours * 60,
        quietHours: item.quietHours ?? null
      };
    })
  };
}

export function useWorkfeedPreferences() {
  const preferences = ref<WorkfeedPreferenceState>(createDefaultState());
  const preferenceRecords = ref<NotificationPreferenceRecord[]>([]);
  const loadingPreferences = ref(false);
  const savingPreferences = ref(false);
  let preferenceRequestSequence = 0;

  function applyPreferenceRecords(records: NotificationPreferenceRecord[]) {
    preferenceRecords.value = records;
    preferences.value = toPreferenceState(records);
  }

  async function loadPreferences() {
    const requestSequence = ++preferenceRequestSequence;
    loadingPreferences.value = true;

    try {
      const records = await fetchNotificationPreferences();

      if (requestSequence !== preferenceRequestSequence) {
        return;
      }

      applyPreferenceRecords(records);
    } catch {
      if (requestSequence !== preferenceRequestSequence) {
        return;
      }

      ElMessage.error("通知偏好加载失败，请稍后重试。");
    } finally {
      if (requestSequence === preferenceRequestSequence) {
        loadingPreferences.value = false;
      }
    }
  }

  async function persistPreferences(nextState: WorkfeedPreferenceState) {
    const previousState = preferences.value;
    const requestSequence = ++preferenceRequestSequence;

    preferences.value = nextState;
    savingPreferences.value = true;

    try {
      const records = await updateNotificationPreferences(toUpsertPayload(nextState, preferenceRecords.value));

      if (requestSequence !== preferenceRequestSequence) {
        return;
      }

      applyPreferenceRecords(records);
      ElMessage.success("通知偏好已更新。");
    } catch {
      if (requestSequence !== preferenceRequestSequence) {
        return;
      }

      preferences.value = previousState;
      ElMessage.error("通知偏好保存失败，请稍后重试。");
    } finally {
      if (requestSequence === preferenceRequestSequence) {
        loadingPreferences.value = false;
        savingPreferences.value = false;
      }
    }
  }

  const enabledChannelCount = computed(
    () => Object.values(preferences.value.channels).filter(Boolean).length
  );
  const enabledSubscriptionCount = computed(
    () => Object.values(preferences.value.subscriptions).filter(Boolean).length
  );

  function toggleChannel(channel: WorkfeedChannel) {
    if (channel === "IN_APP") {
      return;
    }

    void persistPreferences({
      ...preferences.value,
      channels: {
        ...preferences.value.channels,
        [channel]: !preferences.value.channels[channel]
      }
    });
  }

  function toggleSubscription(type: WorkfeedNotificationType) {
    const linkedTypes = getLinkedSubscriptionTypes(type);
    const nextEnabled = !preferences.value.subscriptions[type];
    const nextSubscriptions = { ...preferences.value.subscriptions };

    for (const linkedType of linkedTypes) {
      nextSubscriptions[linkedType] = nextEnabled;
    }

    void persistPreferences({
      ...preferences.value,
      subscriptions: nextSubscriptions
    });
  }

  function setDigestMode(mode: WorkfeedDigestMode) {
    void persistPreferences({
      ...preferences.value,
      digestMode: mode
    });
  }

  function setEscalationHours(hours: number) {
    void persistPreferences({
      ...preferences.value,
      escalationHours: hours
    });
  }

  function resetPreferences() {
    void persistPreferences(createDefaultState());
  }

  return {
    preferences,
    enabledChannelCount,
    enabledSubscriptionCount,
    loadPreferences,
    loadingPreferences,
    savingPreferences,
    resetPreferences,
    setDigestMode,
    setEscalationHours,
    toggleChannel,
    toggleSubscription
  };
}
