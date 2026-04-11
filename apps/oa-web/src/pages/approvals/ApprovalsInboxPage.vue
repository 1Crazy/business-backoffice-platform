<!-- 待我审批页面：负责组装审批列表和通过/驳回操作。 -->
<template>
  <section class="page-card table-page">
    <div class="section-head">
      <div>
        <span class="page-kicker">待办流程</span>
        <h2 class="page-section-title">待我审批</h2>
      </div>
      <p class="page-section-caption">当前待处理事项。</p>
    </div>

    <div class="page-table-shell">
      <el-table :data="approvals" border>
        <el-table-column prop="applicantName" label="申请人" min-width="120" />
        <el-table-column label="请假类型" min-width="120">
          <template #default="{ row }">{{ formatLeaveType(row.leaveType) }}</template>
        </el-table-column>
        <el-table-column label="请假时间" min-width="220">
          <template #default="{ row }">{{ formatDateTime(row.startAt) }} ~ {{ formatDateTime(row.endAt) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="事由" min-width="240" />
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

    <el-empty v-if="approvals.length === 0" description="当前没有待你处理的审批事项" />

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
        <p>申请人：{{ currentApproval.applicantName }}</p>
        <p>请假类型：{{ formatLeaveType(currentApproval.leaveType) }}</p>
        <p>请假时间：{{ formatDateTime(currentApproval.startAt) }} ~ {{ formatDateTime(currentApproval.endAt) }}</p>
        <p>事由：{{ currentApproval.reason }}</p>
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
import { computed } from "vue";

import { useApprovalsInboxPage } from "@/composables/approvals/useApprovalsInboxPage";
import { formatDateTime, formatLeaveStatus, formatLeaveType } from "@/utils/display";

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

const decisionActionText = computed(() => (pendingDecision.value === "REJECTED" ? "驳回" : "通过"));
const decisionDialogTitle = computed(() => `${decisionActionText.value}申请`);
const decisionAlertTitle = computed(() => `${decisionActionText.value}后将立即更新审批状态`);
const decisionAlertDescription = computed(() => {
  if (!currentApproval.value) {
    return "";
  }

  return `${currentApproval.value.applicantName}的${formatLeaveType(currentApproval.value.leaveType)}申请将被标记为${
    pendingDecision.value === "REJECTED" ? "已驳回" : "已通过"
  }。`;
});
const decisionCommentPlaceholder = computed(() =>
  pendingDecision.value === "REJECTED" ? "可选，补充驳回原因或处理建议" : "可选，补充审批意见或交接说明"
);
const decisionConfirmText = computed(() => `确认${decisionActionText.value}`);
</script>

<style scoped>
.table-page {
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
  max-width: 440px;
  margin: 0;
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

@media (max-width: 640px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
