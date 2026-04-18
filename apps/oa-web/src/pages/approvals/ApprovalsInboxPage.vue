<template>
  <section class="page-shell">
    <section class="page-card hero-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">待办流程</span>
          <h2 class="page-section-title">待我审批</h2>
        </div>
        <p class="page-section-caption">模板统一处理。</p>
      </div>

      <div class="metric-grid">
        <article class="metric-item">
          <span>全部</span>
          <strong>{{ approvals.length }}</strong>
        </article>
        <article class="metric-item">
          <span>请假</span>
          <strong>{{ leaveApprovalCount }}</strong>
        </article>
        <article class="metric-item">
          <span>行政</span>
          <strong>{{ administrativeApprovalCount }}</strong>
        </article>
      </div>

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
    </section>

    <section class="page-card table-card">
      <div class="page-table-shell">
        <el-table :data="visibleApprovals" border>
          <el-table-column label="模板" min-width="140">
            <template #default="{ row }">
              <span class="template-pill">{{ getWorkflowTemplateLabel(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="编号" min-width="150">
            <template #default="{ row }">{{ row.requestNo || "-" }}</template>
          </el-table-column>
          <el-table-column prop="applicantName" label="申请人" min-width="120" />
          <el-table-column label="标题" min-width="220">
            <template #default="{ row }">{{ row.title }}</template>
          </el-table-column>
          <el-table-column prop="summary" label="摘要" min-width="260" />
          <el-table-column label="提交时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.submittedAt) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <span class="status-pill pending">{{ formatLeaveStatus(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button text :loading="processingId === row.id" @click="openDecisionDialog(row, 'APPROVED')">通过</el-button>
              <el-button text :loading="processingId === row.id" @click="openDecisionDialog(row, 'REJECTED')">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="visibleApprovals.length === 0" description="当前没有待处理流程" />
    </section>

    <el-dialog
      v-model="decisionDialogVisible"
      :title="decisionDialogTitle"
      width="520px"
      append-to-body
      :close-on-click-modal="!decisionSubmitting"
      :close-on-press-escape="!decisionSubmitting"
      :show-close="!decisionSubmitting"
      @closed="closeDecisionDialog"
    >
      <el-alert
        v-if="currentApproval"
        :type="pendingDecision === 'REJECTED' ? 'warning' : 'success'"
        show-icon
        :closable="false"
        class="decision-summary"
        :title="decisionAlertTitle"
        :description="decisionAlertDescription"
      />

      <div v-if="currentApproval" class="decision-meta">
        <p>模板：{{ getWorkflowTemplateLabel(currentApproval) }}</p>
        <p v-if="currentApproval.requestNo">编号：{{ currentApproval.requestNo }}</p>
        <p>申请人：{{ currentApproval.applicantName }}</p>
        <p>标题：{{ currentApproval.title }}</p>
        <p>摘要：{{ currentApproval.summary }}</p>
      </div>

      <el-form class="dialog-form" label-position="top">
        <el-form-item :label="`${decisionActionText}意见`">
          <el-input
            v-model="decisionComment"
            type="textarea"
            :rows="4"
            :placeholder="decisionCommentPlaceholder"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button :disabled="decisionSubmitting" @click="closeDecisionDialog">取消</el-button>
        <el-button :type="pendingDecision === 'REJECTED' ? 'danger' : 'primary'" :loading="decisionSubmitting" @click="submitDecision">
          {{ decisionConfirmText }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { WORKFLOW_TEMPLATE_DEFINITIONS, resolveWorkflowTemplateKeyByApproval } from "@/config/workflow-templates";
import { useApprovalsInboxPage } from "@/composables/approvals/useApprovalsInboxPage";
import type { PendingApprovalItem, WorkflowTemplateKey } from "@/types/office-automation";
import { formatDateTime, formatLeaveStatus, formatWorkflowTemplate } from "@/utils/display";

const {
  approvals,
  closeDecisionDialog,
  currentApproval,
  decisionComment,
  decisionDialogVisible,
  decisionSubmitting,
  openDecisionDialog,
  pendingDecision,
  processingId,
  submitDecision
} = useApprovalsInboxPage();

const selectedTemplate = ref<WorkflowTemplateKey | "ALL">("ALL");
const decisionActionText = computed(() => (pendingDecision.value === "REJECTED" ? "驳回" : "通过"));
const decisionDialogTitle = computed(() => `${decisionActionText.value}流程`);
const decisionAlertTitle = computed(() => `${decisionActionText.value}后将立即更新流程状态`);
const decisionCommentPlaceholder = computed(() =>
  pendingDecision.value === "REJECTED" ? "可选，补充驳回原因" : "可选，补充处理意见"
);
const decisionConfirmText = computed(() => `确认${decisionActionText.value}`);
const leaveApprovalCount = computed(() => approvals.value.filter((item) => item.requestCategory === "LEAVE").length);
const administrativeApprovalCount = computed(
  () => approvals.value.filter((item) => item.requestCategory === "ADMINISTRATIVE").length
);
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
const visibleApprovals = computed(() => {
  if (selectedTemplate.value === "ALL") {
    return approvals.value;
  }

  return approvals.value.filter((item) => resolveWorkflowTemplateKeyByApproval(item) === selectedTemplate.value);
});
const decisionAlertDescription = computed(() => {
  if (!currentApproval.value) {
    return "";
  }

  return `${currentApproval.value.applicantName}的${getWorkflowTemplateLabel(currentApproval.value)}将被标记为${
    pendingDecision.value === "REJECTED" ? "已驳回" : "已通过"
  }。`;
});

function getWorkflowTemplateLabel(item: Pick<PendingApprovalItem, "requestCategory" | "requestType">) {
  return formatWorkflowTemplate(resolveWorkflowTemplateKeyByApproval(item));
}
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.hero-card,
.table-card {
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-item {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(125, 148, 171, 0.12);
  background: rgba(255, 255, 255, 0.7);
}

.metric-item span {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-item strong {
  font-size: 28px;
  line-height: 1;
}

.template-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.template-filter,
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

.template-filter {
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.template-filter.active,
.template-filter:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.18);
  color: var(--app-accent-strong);
}

.template-pill {
  justify-self: start;
}

.decision-summary {
  margin-bottom: 16px;
}

.decision-meta {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(148, 163, 184, 0.12);
}

.decision-meta p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
