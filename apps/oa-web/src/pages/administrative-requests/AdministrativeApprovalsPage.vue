<!-- 行政审批页面：负责处理待我审批的行政申请，并支持查看详情和审批动作。 -->
<template>
  <section class="page-shell">
    <section class="page-card filter-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">流程协同</span>
          <h2 class="page-section-title">行政审批</h2>
        </div>
        <p class="page-section-caption">统一处理报销、出差、采购和用印等行政申请。</p>
      </div>

      <div class="filter-toolbar">
        <el-select v-model="filters.type" clearable placeholder="全部类型" size="small" class="filter-field">
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="全部状态" size="small" class="filter-field">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" size="small" :loading="isLoading" @click="loadData">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="page-card table-shell">
      <el-table v-if="requests.length" :data="requests" border>
        <el-table-column prop="applicantName" label="申请人" min-width="120" />
        <el-table-column label="申请类型" min-width="120">
          <template #default="{ row }">{{ formatAdministrativeRequestType(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="summary" label="摘要" min-width="240" show-overflow-tooltip />
        <el-table-column label="提交时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.submittedAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="status-pill" :class="row.status.toLowerCase()">
              {{ formatAdministrativeRequestStatus(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text @click="openAdministrativeRequestDetail(row.id)">详情</el-button>
            <el-button text :loading="processingId === row.id" @click="openDecisionDialog(row, 'APPROVED')">通过</el-button>
            <el-button text :loading="processingId === row.id" @click="openDecisionDialog(row, 'REJECTED')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else-if="!isLoading" description="当前没有待处理的行政审批" />
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
        v-if="currentRequest"
        :type="pendingDecision === 'REJECTED' ? 'warning' : 'success'"
        show-icon
        :closable="false"
        class="decision-summary"
        :title="decisionAlertTitle"
        :description="decisionAlertDescription"
      />

      <div v-if="currentRequest" class="decision-meta">
        <p>申请人：{{ currentRequest.applicantName || "-" }}</p>
        <p>类型：{{ formatAdministrativeRequestType(currentRequest.type) }}</p>
        <p>摘要：{{ currentRequest.summary }}</p>
        <p>提交时间：{{ formatDateTime(currentRequest.submittedAt) }}</p>
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

    <AdministrativeRequestDetailDrawer
      v-model:visible="drawerVisible"
      :request="request"
      :is-loading="isRequestLoading"
      :is-tablet-or-down="isTabletOrDown"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useAdministrativeRequestCollectionPage } from "@/composables/administrative-requests/useAdministrativeRequestCollectionPage";
import { useAdministrativeRequestDetailDrawer } from "@/composables/administrative-requests/useAdministrativeRequestDetailDrawer";
import AdministrativeRequestDetailDrawer from "@/pages/administrative-requests/components/AdministrativeRequestDetailDrawer.vue";
import {
  formatAdministrativeRequestStatus,
  formatAdministrativeRequestType,
  formatDateTime
} from "@/utils/display";

const {
  closeDecisionDialog,
  currentRequest,
  decisionComment,
  decisionDialogVisible,
  decisionSubmitting,
  filters,
  isLoading,
  loadData,
  openDecisionDialog,
  pendingDecision,
  processingId,
  requests,
  resetFilters,
  submitDecision
} = useAdministrativeRequestCollectionPage("pending");

const {
  drawerVisible,
  isLoading: isRequestLoading,
  isTabletOrDown,
  openAdministrativeRequestDetail,
  request
} = useAdministrativeRequestDetailDrawer();

const typeOptions = computed(() => [
  { label: "报销申请", value: "REIMBURSEMENT" },
  { label: "出差申请", value: "TRAVEL" },
  { label: "采购申请", value: "PURCHASE" },
  { label: "用印申请", value: "SEAL" }
]);

const statusOptions = computed(() => [
  { label: "待审批", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "已驳回", value: "REJECTED" }
]);

const decisionActionText = computed(() => (pendingDecision.value === "REJECTED" ? "驳回" : "通过"));
const decisionDialogTitle = computed(() => `${decisionActionText.value}行政申请`);
const decisionAlertTitle = computed(() => `${decisionActionText.value}后将立即更新行政审批状态`);
const decisionAlertDescription = computed(() => {
  if (!currentRequest.value) {
    return "";
  }

  return `${currentRequest.value.title} 将被标记为${
    pendingDecision.value === "REJECTED" ? "已驳回" : "已通过"
  }。`;
});
const decisionCommentPlaceholder = computed(() =>
  pendingDecision.value === "REJECTED" ? "可选，补充驳回原因或处理建议" : "可选，补充审批意见或执行说明"
);
const decisionConfirmText = computed(() => `确认${decisionActionText.value}`);
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.filter-card,
.table-shell {
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
  max-width: 420px;
  margin: 0;
}

.filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: fit-content;
  max-width: 100%;
}

.filter-field {
  width: 188px;
}

.filter-field :deep(.el-select__wrapper),
.filter-actions :deep(.el-button) {
  min-height: 36px;
}

.filter-actions {
  display: inline-flex;
  gap: 8px;
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

@media (max-width: 720px) {
  .section-head {
    flex-direction: column;
  }

  .filter-toolbar {
    width: 100%;
  }

  .filter-field {
    flex: 1 1 160px;
    min-width: 0;
  }

  .filter-actions {
    margin-left: auto;
  }
}

@media (max-width: 520px) {
  .filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
