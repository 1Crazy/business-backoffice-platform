<template>
  <section class="section-shell">
    <div class="toolbar-row">
      <div>
        <h3>企业身份连接器</h3>
        <p>绑定租户级统一登录、目录服务或授权登录入口，并定义身份映射规则。</p>
      </div>
      <el-button type="primary" @click="$emit('create')">新增连接器</el-button>
    </div>

    <div v-if="connectors.length" class="card-grid">
      <article v-for="item in connectors" :key="item.id" class="connector-card">
        <div class="card-top">
          <div>
            <strong>{{ item.name }}</strong>
            <p>{{ formatIdentityConnectorType(item.type) }} · {{ formatIdentityConnectorMatchField(item.matchField) }}</p>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">
            {{ item.status === "ACTIVE" ? "启用中" : "已停用" }}
          </span>
        </div>

        <div class="card-meta">
          <span>签发方地址：{{ item.issuerUrl || "-" }}</span>
          <span>客户端标识：{{ item.clientId || "-" }}</span>
          <span>最近登录：{{ formatDateTime(item.lastAuthenticatedAt) }}</span>
          <span>最近失败：{{ formatDateTime(item.lastFailureAt) }}</span>
        </div>

        <div v-if="item.allowedDomains.length" class="tag-row">
          <span v-for="domain in item.allowedDomains" :key="domain" class="meta-chip">{{ domain }}</span>
        </div>

        <div v-if="item.lastFailureMessage" class="failure-note">
          {{ item.lastFailureMessage }}
        </div>

        <div class="card-actions">
          <el-button text @click="$emit('edit', item)">编辑</el-button>
        </div>
      </article>
    </div>
    <el-empty v-else description="当前租户还没有企业身份连接器" />
  </section>
</template>

<script setup lang="ts">
import type { IdentityConnectorRecord } from "@/types/system-administration";
import {
  formatDateTime,
  formatIdentityConnectorMatchField,
  formatIdentityConnectorType
} from "@/utils/display";

defineProps<{
  connectors: IdentityConnectorRecord[];
}>();

defineEmits<{
  create: [];
  edit: [record: IdentityConnectorRecord];
}>();
</script>

<style scoped>
.section-shell,
.card-grid {
  display: grid;
  gap: 16px;
}

.toolbar-row,
.card-top,
.card-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-row h3 {
  margin: 0 0 6px;
}

.toolbar-row p {
  margin: 0;
  color: var(--app-text-secondary);
}

.card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.connector-card {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.card-top strong {
  font-size: 16px;
}

.card-top p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.card-meta,
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.card-meta {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
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

.status-pill.active {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill.disabled {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.failure-note {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  font-size: 12px;
}

@media (max-width: 960px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row,
  .card-top,
  .card-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
