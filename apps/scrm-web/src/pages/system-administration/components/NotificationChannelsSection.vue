<template>
  <section class="channel-grid">
    <article v-for="item in channels" :key="item.id" class="channel-card">
      <div class="channel-top">
        <div>
          <strong>{{ item.label }}</strong>
          <p>适用范围：{{ formatNotificationRouteScope(item.routeScope) }}</p>
        </div>
        <span class="status-pill" :class="item.status.toLowerCase()">{{ formatGovernanceHealthStatus(item.status) }}</span>
      </div>

      <div class="channel-meta">
        <span>兜底渠道：{{ formatNotificationChannel(item.fallbackChannel) }}</span>
        <span>失败：{{ item.recentFailures }}</span>
        <span>更新：{{ formatDateTime(item.updatedAt) }}</span>
        <span>提供方：{{ formatNotificationProvider(item.provider) }}</span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { NotificationChannelSnapshot } from "@/types/system-administration";
import {
  formatDateTime,
  formatGovernanceHealthStatus,
  formatNotificationChannel,
  formatNotificationProvider,
  formatNotificationRouteScope
} from "@/utils/display";

defineProps<{
  channels: NotificationChannelSnapshot[];
}>();
</script>

<style scoped>
.channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.channel-card {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.channel-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.channel-top strong {
  font-size: 16px;
}

.channel-top p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.channel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill.healthy {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill.warning {
  background: rgba(217, 119, 6, 0.12);
  color: #b45309;
}

.status-pill.error {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

@media (max-width: 960px) {
  .channel-grid {
    grid-template-columns: 1fr;
  }

  .channel-top {
    flex-direction: column;
  }
}
</style>
