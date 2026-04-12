<!-- 复用组件：负责在行政申请列表和审批列表中承载申请详情抽屉。 -->
<template>
  <el-drawer
    v-model="drawerVisible"
    title="行政申请详情"
    :size="isTabletOrDown ? '100%' : '760px'"
    append-to-body
  >
    <div v-loading="isLoading" class="drawer-stack">
      <template v-if="request">
        <section class="detail-panel">
          <div class="detail-hero">
            <div class="detail-hero-main">
              <h3>{{ request.title }}</h3>
              <p>{{ request.summary }}</p>
            </div>
            <span class="status-pill" :class="request.status.toLowerCase()">
              {{ formatAdministrativeRequestStatus(request.status) }}
            </span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span>申请编号</span>
              <strong>{{ request.requestNo }}</strong>
            </div>
            <div class="meta-item">
              <span>申请类型</span>
              <strong>{{ formatAdministrativeRequestType(request.type) }}</strong>
            </div>
            <div class="meta-item">
              <span>申请人</span>
              <strong>{{ request.applicantName || "-" }}</strong>
            </div>
            <div class="meta-item">
              <span>审批人</span>
              <strong>{{ request.approverName || "-" }}</strong>
            </div>
            <div class="meta-item">
              <span>提交时间</span>
              <strong>{{ formatDateTime(request.submittedAt) }}</strong>
            </div>
            <div class="meta-item">
              <span>审批完成</span>
              <strong>{{ formatDateTime(request.decidedAt || null) }}</strong>
            </div>
          </div>

          <section class="detail-section">
            <h4>申请说明</h4>
            <p class="plain-text">{{ request.reason }}</p>
          </section>

          <section class="detail-section">
            <h4>结构化字段</h4>
            <div v-if="request.formFields.length" class="field-list">
              <article v-for="item in request.formFields" :key="item.label" class="field-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value || "-" }}</strong>
              </article>
            </div>
            <el-empty v-else description="暂无结构化字段" />
          </section>

          <section class="detail-section">
            <h4>附件</h4>
            <div v-if="request.attachmentNames.length" class="attachment-list">
              <el-tag
                v-for="item in request.attachmentNames"
                :key="item"
                type="info"
                effect="plain"
                round
              >
                {{ item }}
              </el-tag>
            </div>
            <el-empty v-else description="未上传附件" />
          </section>

          <section class="detail-section">
            <h4>审批轨迹</h4>
            <div v-if="request.timeline.length" class="timeline-list">
              <article
                v-for="(item, index) in request.timeline"
                :key="`${item.createdAt}-${item.actionType}-${index}`"
                class="timeline-item"
              >
                <div class="timeline-top">
                  <strong>{{ formatAdministrativeRequestActionType(item.actionType) }}</strong>
                  <span>{{ formatDateTime(item.createdAt) }}</span>
                </div>
                <p>处理人：{{ item.actorName }}</p>
                <p>处理意见：{{ item.comment || "无" }}</p>
              </article>
            </div>
            <el-empty v-else description="暂无审批轨迹" />
          </section>
        </section>
      </template>

      <el-empty v-else-if="!isLoading" description="申请详情暂不可用" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AdministrativeRequestDetail } from "@/types/office-automation";
import {
  formatAdministrativeRequestActionType,
  formatAdministrativeRequestStatus,
  formatAdministrativeRequestType,
  formatDateTime
} from "@/utils/display";

const props = defineProps<{
  visible: boolean;
  request: AdministrativeRequestDetail | null;
  isLoading: boolean;
  isTabletOrDown: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});
</script>

<style scoped>
.drawer-stack {
  min-height: 240px;
}

.detail-panel {
  display: grid;
  gap: 20px;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.detail-hero-main {
  display: grid;
  gap: 8px;
}

.detail-hero-main h3 {
  margin: 0;
  font-size: 26px;
  line-height: 1.22;
  letter-spacing: -0.03em;
}

.detail-hero-main p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.meta-item {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.1);
}

.meta-item span {
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.meta-item strong {
  color: var(--app-text-primary);
  font-size: 14px;
}

.detail-section {
  display: grid;
  gap: 10px;
}

.detail-section h4 {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-primary);
}

.plain-text {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.field-list {
  display: grid;
  gap: 10px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(125, 148, 171, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

.field-item span {
  color: var(--app-text-tertiary);
}

.field-item strong {
  color: var(--app-text-primary);
  text-align: right;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.timeline-list {
  display: grid;
  gap: 10px;
}

.timeline-item {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(125, 148, 171, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

.timeline-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.timeline-top strong {
  color: var(--app-text-primary);
}

.timeline-top span {
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.timeline-item p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .detail-hero,
  .meta-grid,
  .field-item,
  .timeline-top {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .field-item strong {
    text-align: left;
  }
}
</style>
