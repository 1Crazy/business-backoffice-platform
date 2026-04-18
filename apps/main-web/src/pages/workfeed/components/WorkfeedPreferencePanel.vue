<template>
  <section class="page-card preference-shell">
    <div class="preference-head">
      <div>
        <span class="page-kicker">通知偏好</span>
        <h2 class="page-section-title">消息中心</h2>
      </div>
      <el-button size="small" :disabled="disabled" @click="$emit('reset')">重置</el-button>
    </div>

    <section class="preference-block">
      <div class="preference-block-head">
        <strong>渠道</strong>
        <span>{{ enabledChannelCount }} 已开启</span>
      </div>
      <div class="toggle-grid">
        <button
          v-for="item in channelItems"
          :key="item.key"
          type="button"
          class="toggle-card"
          :class="{
            active: item.enabled,
            inactive: !item.enabled,
            locked: item.locked
          }"
          :disabled="disabled"
          @click="handleChannelClick(item)"
        >
          <div class="toggle-card-topline">
            <small>{{ item.caption }}</small>
            <span class="toggle-card-state" :class="{ enabled: item.enabled, locked: item.locked }">
              {{ item.locked ? "固定开启" : item.enabled ? "已开启" : "已关闭" }}
            </span>
          </div>
          <strong>{{ item.label }}</strong>
          <p class="toggle-card-helper">
            {{ item.locked ? "站内消息是基础渠道，当前版本暂不支持关闭。" : item.enabled ? "点击可关闭该通知渠道。" : "点击即可重新开启该通知渠道。" }}
          </p>
        </button>
      </div>
    </section>

    <section class="preference-block">
      <div class="preference-block-head">
        <strong>订阅</strong>
        <span>{{ enabledSubscriptionCount }} 已开启</span>
      </div>
      <div class="toggle-grid">
        <button
          v-for="item in subscriptionItems"
          :key="item.key"
          type="button"
          class="toggle-card"
          :class="{ active: item.enabled, inactive: !item.enabled }"
          :disabled="disabled"
          @click="$emit('toggle-subscription', item.key)"
        >
          <div class="toggle-card-topline">
            <small>{{ item.caption }}</small>
            <span class="toggle-card-state" :class="{ enabled: item.enabled }">
              {{ item.enabled ? "已订阅" : "已关闭" }}
            </span>
          </div>
          <strong>{{ item.label }}</strong>
          <p class="toggle-card-helper">
            {{ item.enabled ? "点击后不再接收该类通知。" : "点击后恢复接收该类通知。" }}
            <span v-if="item.helperText">{{ item.helperText }}</span>
          </p>
        </button>
      </div>
    </section>

    <section class="preference-rule-grid">
      <article class="rule-card">
        <span>汇总频率</span>
        <el-select
          :model-value="digestMode"
          :disabled="disabled"
          placeholder="请选择汇总频率"
          @update:model-value="$emit('update:digest-mode', $event)"
        >
          <el-option v-for="item in digestOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </article>
      <article class="rule-card">
        <span>催办阈值</span>
        <el-select
          :model-value="escalationHours"
          :disabled="disabled"
          placeholder="请选择催办阈值"
          @update:model-value="$emit('update:escalation-hours', Number($event))"
        >
          <el-option v-for="item in escalationOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { WorkfeedChannel, WorkfeedDigestMode, WorkfeedNotificationType } from "@/types/workfeed";

defineProps<{
  channelItems: Array<{
    key: WorkfeedChannel;
    label: string;
    caption: string;
    enabled: boolean;
    locked?: boolean;
  }>;
  subscriptionItems: Array<{
    key: WorkfeedNotificationType;
    label: string;
    caption: string;
    enabled: boolean;
    helperText?: string;
  }>;
  digestMode: WorkfeedDigestMode;
  escalationHours: number;
  enabledChannelCount: number;
  enabledSubscriptionCount: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  reset: [];
  "locked-channel": [channel: WorkfeedChannel];
  "toggle-channel": [channel: WorkfeedChannel];
  "toggle-subscription": [type: WorkfeedNotificationType];
  "update:digest-mode": [mode: WorkfeedDigestMode];
  "update:escalation-hours": [hours: number];
}>();

const digestOptions = [
  {
    value: "IMMEDIATE",
    label: "实时"
  },
  {
    value: "HOURLY",
    label: "每小时"
  },
  {
    value: "DAILY",
    label: "每日汇总"
  },
  {
    value: "WEEKLY",
    label: "每周汇总"
  }
] as const;

const escalationOptions = [
  {
    value: 4,
    label: "4 小时"
  },
  {
    value: 8,
    label: "8 小时"
  },
  {
    value: 24,
    label: "24 小时"
  }
] as const;

function handleChannelClick(item: {
  key: WorkfeedChannel;
  locked?: boolean;
}): void {
  if (item.locked) {
    emit("locked-channel", item.key);
    return;
  }

  emit("toggle-channel", item.key);
}
</script>

<style scoped>
.preference-shell {
  display: grid;
  gap: 18px;
}

.preference-head,
.preference-block-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.preference-block {
  display: grid;
  gap: 12px;
}

.preference-block-head strong {
  font-size: 15px;
}

.preference-block-head span {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.toggle-grid,
.preference-rule-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.toggle-card,
.rule-card {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(248, 250, 252, 0.9);
}

.toggle-card {
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.toggle-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toggle-card:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-card.active {
  border-color: rgba(37, 99, 235, 0.22);
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(255, 255, 255, 0.98));
  box-shadow: 0 14px 24px rgba(37, 99, 235, 0.08);
}

.toggle-card.inactive {
  background: rgba(248, 250, 252, 0.78);
}

.toggle-card.locked {
  border-style: solid;
}

.toggle-card:hover:not(:disabled) {
  transform: translateY(-1px);
}

.toggle-card small,
.rule-card span {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toggle-card strong {
  line-height: 1.5;
}

.toggle-card-state {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.toggle-card-state.enabled {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.toggle-card-state.locked {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.toggle-card-helper {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1180px) {
  .toggle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .toggle-grid,
  .preference-rule-grid {
    grid-template-columns: 1fr;
  }

  .preference-head,
  .preference-block-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
