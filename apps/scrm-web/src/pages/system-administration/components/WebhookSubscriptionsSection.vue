<template>
  <section class="section-shell">
    <div class="toolbar-row">
      <div>
        <h3>回调订阅</h3>
        <p>维护事件回调地址、签名密钥和失败重试策略。</p>
      </div>
      <el-button type="primary" @click="$emit('create')">新建订阅</el-button>
    </div>

    <div v-if="secretNotice" class="secret-card">
      <span class="table-kicker">签名密钥</span>
      <strong>{{ secretNotice.label }}</strong>
      <p>签名密钥仅展示一次，回调头部会使用同一密钥生成签名摘要（HMAC）。</p>
      <code>{{ secretNotice.secret }}</code>
    </div>

    <div v-if="subscriptions.length" class="subscription-list">
      <article v-for="item in subscriptions" :key="item.id" class="subscription-card">
        <div class="card-top">
          <div>
            <strong>{{ item.name }}</strong>
            <p>{{ item.endpointUrl }}</p>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">
            {{ formatWebhookSubscriptionStatus(item.status) }}
          </span>
        </div>

        <div class="tag-row">
          <span v-for="eventType in item.eventTypes" :key="eventType" class="meta-chip">
            {{ formatWebhookEventType(eventType) }}
          </span>
        </div>

        <div class="card-meta">
          <span>密钥摘要：{{ item.signingSecretHint }}</span>
          <span>最大重试：{{ item.maxAttempts }} 次</span>
          <span>超时：{{ item.timeoutSeconds }} 秒</span>
          <span>最近触发：{{ formatDateTime(item.lastTriggeredAt) }}</span>
        </div>

        <div v-if="deliveriesBySubscriptionId[item.id]?.length" class="history-shell">
          <h4>最近投递</h4>
          <div class="history-list">
            <article v-for="delivery in deliveriesBySubscriptionId[item.id]" :key="delivery.id" class="history-card">
              <div class="history-top">
                <div>
                  <strong>{{ formatWebhookEventType(delivery.eventType) }}</strong>
                  <p class="history-subtitle">
                    {{ getDeliveryModeLabel(delivery) }} · {{ formatDateTime(delivery.deliveredAt ?? delivery.createdAt) }}
                  </p>
                </div>
                <div class="delivery-badges">
                  <span class="mode-pill" :class="getDeliveryModeClass(delivery)">
                    {{ getDeliveryModeLabel(delivery) }}
                  </span>
                  <span class="delivery-pill" :class="delivery.status.toLowerCase()">
                    {{ formatWebhookDeliveryStatus(delivery.status) }}
                  </span>
                </div>
              </div>
              <div class="history-meta">
                <span>尝试 {{ delivery.attemptCount }} 次</span>
                <span v-if="delivery.responseStatusCode">HTTP {{ delivery.responseStatusCode }}</span>
                <span v-if="delivery.durationMs !== null && delivery.durationMs !== undefined">
                  耗时 {{ delivery.durationMs }}ms
                </span>
                <span>创建 {{ formatDateTime(delivery.createdAt) }}</span>
                <span v-if="delivery.errorMessage">{{ delivery.errorMessage }}</span>
              </div>
              <code v-if="delivery.responseBody" class="response-body">{{ delivery.responseBody }}</code>
            </article>
          </div>
        </div>

        <div class="card-actions">
          <el-button text @click="$emit('edit', item)">编辑</el-button>
          <el-button text @click="$emit('test', item)">测试投递</el-button>
        </div>
      </article>
    </div>
    <el-empty v-else description="当前租户还没有回调订阅" />
  </section>
</template>

<script setup lang="ts">
import type {
  SecretRevealNotice,
  WebhookDeliveryRecord,
  WebhookSubscriptionRecord
} from "@/types/system-administration";
import {
  formatDateTime,
  formatWebhookDeliveryStatus,
  formatWebhookEventType,
  formatWebhookSubscriptionStatus
} from "@/utils/display";

defineProps<{
  subscriptions: WebhookSubscriptionRecord[];
  deliveriesBySubscriptionId: Record<string, WebhookDeliveryRecord[]>;
  secretNotice: SecretRevealNotice | null;
}>();

defineEmits<{
  create: [];
  edit: [record: WebhookSubscriptionRecord];
  test: [record: WebhookSubscriptionRecord];
}>();

function getDeliveryModeLabel(delivery: WebhookDeliveryRecord): string {
  if (delivery.deliveryMode === "SIMULATION" || delivery.responseBody?.startsWith("simulation:")) {
    return "模拟测试";
  }

  return "真实投递";
}

function getDeliveryModeClass(delivery: WebhookDeliveryRecord): string {
  return getDeliveryModeLabel(delivery) === "模拟测试" ? "simulation" : "real";
}
</script>

<style scoped>
.section-shell,
.subscription-list,
.history-list {
  display: grid;
  gap: 16px;
}

.toolbar-row,
.card-top,
.card-actions,
.history-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-row h3,
.history-shell h4 {
  margin: 0 0 6px;
}

.toolbar-row p {
  margin: 0;
  color: var(--app-text-secondary);
}

.secret-card,
.subscription-card,
.history-card {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.secret-card code {
  display: block;
  overflow-x: auto;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
}

.card-top strong {
  font-size: 16px;
}

.card-top p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  word-break: break-all;
}

.tag-row,
.card-meta,
.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip,
.table-kicker {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-meta,
.history-meta {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.history-subtitle {
  margin: 4px 0 0;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.history-shell {
  display: grid;
  gap: 12px;
}

.delivery-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.delivery-pill,
.mode-pill,
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

.mode-pill.real {
  background: rgba(21, 128, 61, 0.1);
  color: #15803d;
}

.mode-pill.simulation {
  background: rgba(180, 83, 9, 0.12);
  color: #b45309;
}

.status-pill.active,
.delivery-pill.succeeded {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill.disabled,
.delivery-pill.failed {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.delivery-pill.pending {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.response-body {
  display: block;
  max-height: 120px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  color: #f8fafc;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 960px) {
  .toolbar-row,
  .card-top,
  .card-actions,
  .history-top {
    flex-direction: column;
    align-items: stretch;
  }

  .delivery-badges {
    justify-content: flex-start;
  }
}
</style>
