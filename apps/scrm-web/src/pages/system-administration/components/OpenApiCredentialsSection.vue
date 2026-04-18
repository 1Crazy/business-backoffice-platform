<template>
  <section class="section-shell">
    <div class="toolbar-row">
      <div>
        <h3>租户开放接口凭证</h3>
        <p>管理租户级接口密钥、权限范围与轮换节奏。</p>
      </div>
      <el-button type="primary" @click="$emit('create')">新建凭证</el-button>
    </div>

    <div v-if="secretNotice" class="secret-card">
      <span class="table-kicker">一次展示</span>
      <strong>{{ secretNotice.label }}</strong>
      <p>请立即保存明文密钥，后续界面不会再次展示。</p>
      <code>{{ secretNotice.secret }}</code>
    </div>

    <div v-if="credentials.length" class="card-grid">
      <article v-for="item in credentials" :key="item.id" class="governance-card">
        <div class="card-top">
          <div>
            <strong>{{ item.name }}</strong>
            <p>{{ item.accessKey }}</p>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">
            {{ formatOpenApiCredentialStatus(item.status) }}
          </span>
        </div>

        <div class="scope-row">
          <span v-for="scope in item.scopes" :key="scope" class="meta-chip">{{ formatOpenApiScope(scope) }}</span>
        </div>

        <div class="card-meta">
          <span>最近使用：{{ formatDateTime(item.lastUsedAt) }}</span>
          <span>轮换时间：{{ formatDateTime(item.rotatedAt) }}</span>
          <span>过期时间：{{ formatDateTime(item.expiresAt) }}</span>
        </div>

        <div class="card-actions">
          <el-button text @click="$emit('rotate', item)">轮换密钥</el-button>
          <el-button text type="danger" :disabled="item.status !== 'ACTIVE'" @click="$emit('revoke', item)">
            撤销
          </el-button>
        </div>
      </article>
    </div>
    <el-empty v-else description="当前租户还没有开放接口凭证" />
  </section>
</template>

<script setup lang="ts">
import type { OpenApiCredentialRecord, SecretRevealNotice } from "@/types/system-administration";
import { formatDateTime, formatOpenApiCredentialStatus, formatOpenApiScope } from "@/utils/display";

defineProps<{
  credentials: OpenApiCredentialRecord[];
  secretNotice: SecretRevealNotice | null;
}>();

defineEmits<{
  create: [];
  rotate: [record: OpenApiCredentialRecord];
  revoke: [record: OpenApiCredentialRecord];
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

.secret-card,
.governance-card {
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

.card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.card-top strong {
  font-size: 16px;
}

.card-top p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.scope-row,
.card-meta {
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

.card-meta {
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

.status-pill.active {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.status-pill.revoked {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
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
