<template>
  <section class="page-shell">
    <section class="page-card hero-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">我的流程</span>
          <h2 class="page-section-title">我发起的申请</h2>
        </div>
        <p class="page-section-caption">按模板查看。</p>
      </div>

      <div class="toolbar-row">
        <div class="template-filter-row">
          <button
            v-for="item in templateFilters"
            :key="item.key"
            type="button"
            :class="['template-filter', { active: selectedTemplate === item.key }]"
            @click="selectedTemplate = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="status-filter-row">
          <button
            v-for="item in statusFilters"
            :key="item.key"
            type="button"
            :class="['status-filter', { active: selectedStatus === item.key }]"
            @click="selectedStatus = item.key"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="isLoading" class="request-list">
      <article v-for="item in 3" :key="item" class="request-item skeleton-card">
        <span class="ui-skeleton ui-skeleton-line short" />
        <span class="ui-skeleton ui-skeleton-line medium" />
        <span class="ui-skeleton ui-skeleton-line long" />
      </article>
    </div>

    <div v-else-if="visibleRequests.length" class="request-list">
      <article v-for="item in visibleRequests" :key="item.id" class="page-card request-item">
        <div class="request-top">
          <div class="request-top-main">
            <span class="template-pill">{{ formatWorkflowTemplate(resolveWorkflowTemplateKeyByRequest(item)) }}</span>
            <strong>{{ item.title }}</strong>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">{{ formatLeaveStatus(item.status) }}</span>
        </div>

        <p class="request-summary">{{ item.summary }}</p>

        <div class="request-meta">
          <span>提交时间：{{ formatDateTime(item.submittedAt) }}</span>
          <span>处理人：{{ item.currentHandlerName || "待分配" }}</span>
          <span v-if="item.requestNo">编号：{{ item.requestNo }}</span>
          <span>最近意见：{{ item.latestComment || "暂无" }}</span>
        </div>
      </article>
    </div>

    <el-empty v-else description="当前没有申请记录" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { WORKFLOW_TEMPLATE_DEFINITIONS, resolveWorkflowTemplateKeyByRequest } from "@/config/workflow-templates";
import { useMyRequestsPage } from "@/composables/approvals/useMyRequestsPage";
import type { AdministrativeRequestStatus, LeaveRequestStatus, WorkflowTemplateKey } from "@/types/office-automation";
import { formatDateTime, formatLeaveStatus, formatWorkflowTemplate } from "@/utils/display";

const { isLoading, requests } = useMyRequestsPage();

const selectedTemplate = ref<WorkflowTemplateKey | "ALL">("ALL");
const selectedStatus = ref<LeaveRequestStatus | AdministrativeRequestStatus | "ALL">("ALL");
const templateFilters = computed(() => [
  {
    key: "ALL" as const,
    label: "全部"
  },
  ...WORKFLOW_TEMPLATE_DEFINITIONS.map((item) => ({
    key: item.key,
    label: item.shortLabel
  }))
]);
const statusFilters = [
  {
    key: "ALL" as const,
    label: "全部状态"
  },
  {
    key: "PENDING" as const,
    label: "待审批"
  },
  {
    key: "APPROVED" as const,
    label: "已通过"
  },
  {
    key: "REJECTED" as const,
    label: "已驳回"
  },
  {
    key: "CANCELLED" as const,
    label: "已撤销"
  }
];
const visibleRequests = computed(() =>
  requests.value.filter((item) => {
    const matchesTemplate =
      selectedTemplate.value === "ALL" || resolveWorkflowTemplateKeyByRequest(item) === selectedTemplate.value;
    const matchesStatus = selectedStatus.value === "ALL" || item.status === selectedStatus.value;

    return matchesTemplate && matchesStatus;
  })
);
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.hero-card {
  display: grid;
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-head .page-section-caption {
  max-width: 320px;
  margin: 0;
}

.toolbar-row {
  display: grid;
  gap: 12px;
}

.template-filter-row,
.status-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.template-filter,
.status-filter,
.template-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(125, 148, 171, 0.16);
  background: rgba(255, 255, 255, 0.76);
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.template-filter,
.status-filter {
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.template-filter.active,
.template-filter:hover,
.status-filter.active,
.status-filter:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.18);
  color: var(--app-accent-strong);
}

.request-list {
  display: grid;
  gap: 14px;
}

.request-item {
  display: grid;
  gap: 14px;
}

.request-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.request-top-main {
  display: grid;
  gap: 10px;
}

.request-top-main strong {
  font-size: 16px;
}

.template-pill {
  justify-self: start;
}

.request-summary {
  margin: 0;
  color: var(--app-text-primary);
  line-height: 1.72;
}

.request-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.skeleton-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(125, 148, 171, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

@media (max-width: 640px) {
  .section-head,
  .request-top {
    flex-direction: column;
  }
}
</style>
