<!-- 经营闭环页面：负责承载客户/商机上下文下的报价、合同、回款与续费工作区。 -->
<template>
  <div class="page-stack">
    <section class="page-card workspace-card">
      <div class="workspace-header">
        <div>
          <div class="section-title">经营闭环</div>
          <p class="section-caption">围绕客户与赢单商机处理报价、合同、回款与续费。</p>
        </div>

        <div class="workspace-actions">
          <el-tag type="info">{{ activeContextLabel }}</el-tag>
          <el-button :loading="isContextLoading" @click="refreshContext">刷新</el-button>
        </div>
      </div>

      <div class="context-grid">
        <label class="context-field">
          <span class="context-label">客户</span>
          <el-select
            :model-value="selectedCustomerId"
            placeholder="请选择客户"
            filterable
            clearable
            :loading="isMetaLoading"
            @update:model-value="handleCustomerChange"
          >
            <el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </label>

        <label class="context-field">
          <span class="context-label">赢单商机</span>
          <el-select
            :model-value="selectedOpportunityId"
            placeholder="选择商机后可新建经营对象"
            filterable
            clearable
            :disabled="!selectedCustomerId"
            :loading="isContextLoading"
            @update:model-value="handleOpportunityChange"
          >
            <el-option v-for="item in wonOpportunities" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </label>
      </div>

      <div class="context-overview">
        <article class="context-pill">
          <span>客户</span>
          <strong>{{ selectedCustomer?.name ?? "未选择" }}</strong>
        </article>
        <article class="context-pill">
          <span>商机</span>
          <strong>{{ selectedOpportunity?.name ?? "客户汇总视角" }}</strong>
        </article>
      </div>

      <div v-if="selectedCustomer && !selectedOpportunity" class="context-notice">
        当前为客户汇总视角；新增报价、合同和回款计划前需先选择赢单商机。
      </div>

      <div v-if="activeOverview" class="summary-grid">
        <article v-for="item in summaryCards" :key="item.label" class="summary-card">
          <span>{{ item.label }}</span>
          <strong>{{ formatSummaryValue(item.value, item.formatAs) }}</strong>
          <small>{{ item.helper }}</small>
        </article>
      </div>

      <div class="shortcut-row">
        <el-button type="primary" :disabled="!canCreateOpportunityScopedItems" @click="openQuoteDrawer">新建报价</el-button>
        <el-button type="primary" plain :disabled="!canCreateOpportunityScopedItems" @click="openContractDrawer">
          新建合同
        </el-button>
        <el-button type="primary" plain :disabled="!canCreateOpportunityScopedItems" @click="openPaymentPlanDrawer">
          新建回款计划
        </el-button>
        <el-button :disabled="paymentPlanOptions.length === 0" @click="openPaymentRecordDrawer">登记回款</el-button>
        <el-button :disabled="contractOptions.length === 0 || !selectedCustomer" @click="openRenewalReminderDrawer">
          创建续费提醒
        </el-button>
      </div>
    </section>

    <section v-if="activeOverview" class="page-card operations-card">
      <div class="section-heading">
        <div>
          <div class="section-title">经营对象</div>
          <p class="section-caption">查看当前上下文下的全部经营记录。</p>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="operations-tabs">
        <el-tab-pane name="quotes">
          <template #label>
            <span class="tab-label">
              <span>报价单</span>
              <strong class="tab-count">{{ activeOverview.quotes.length }}</strong>
            </span>
          </template>

          <div class="table-toolbar">
            <span class="table-caption">报价进度与金额口径</span>
            <el-button text :disabled="!canCreateOpportunityScopedItems" @click="openQuoteDrawer">新建报价</el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="activeOverview.quotes" stripe empty-text="当前上下文暂无报价单">
              <el-table-column prop="quoteNo" label="报价编号" min-width="180" />
              <el-table-column prop="title" label="标题" min-width="220" />
              <el-table-column label="金额" min-width="140">
                <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="120">
                <template #default="{ row }">{{ formatQuoteStatus(row.status) }}</template>
              </el-table-column>
              <el-table-column label="有效期" min-width="180">
                <template #default="{ row }">{{ formatDateTime(row.expiresAt || row.issuedAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="96" fixed="right">
                <template #default="{ row }">
                  <el-button text @click="openDetailDrawer('quote', row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane name="contracts">
          <template #label>
            <span class="tab-label">
              <span>合同</span>
              <strong class="tab-count">{{ activeOverview.contracts.length }}</strong>
            </span>
          </template>

          <div class="table-toolbar">
            <span class="table-caption">签约、履约与到期管理</span>
            <el-button text :disabled="!canCreateOpportunityScopedItems" @click="openContractDrawer">新建合同</el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="activeOverview.contracts" stripe empty-text="当前上下文暂无合同">
              <el-table-column prop="contractNo" label="合同编号" min-width="180" />
              <el-table-column prop="title" label="标题" min-width="220" />
              <el-table-column label="金额" min-width="140">
                <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="120">
                <template #default="{ row }">{{ formatContractStatus(row.status) }}</template>
              </el-table-column>
              <el-table-column label="结束时间" min-width="180">
                <template #default="{ row }">{{ formatDateTime(row.endDate) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="96" fixed="right">
                <template #default="{ row }">
                  <el-button text @click="openDetailDrawer('contract', row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane name="paymentPlans">
          <template #label>
            <span class="tab-label">
              <span>回款计划</span>
              <strong class="tab-count">{{ activeOverview.paymentPlans.length }}</strong>
            </span>
          </template>

          <div class="table-toolbar">
            <span class="table-caption">计划金额、已回金额与节点状态</span>
            <el-button text :disabled="!canCreateOpportunityScopedItems" @click="openPaymentPlanDrawer">
              新建回款计划
            </el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="activeOverview.paymentPlans" stripe empty-text="当前上下文暂无回款计划">
              <el-table-column prop="title" label="计划标题" min-width="220" />
              <el-table-column label="计划金额" min-width="140">
                <template #default="{ row }">{{ formatAmount(row.plannedAmount) }}</template>
              </el-table-column>
              <el-table-column label="已回金额" min-width="140">
                <template #default="{ row }">{{ formatAmount(row.receivedAmount) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="120">
                <template #default="{ row }">{{ formatPaymentPlanStatus(row.status) }}</template>
              </el-table-column>
              <el-table-column label="计划日期" min-width="180">
                <template #default="{ row }">{{ formatDateTime(row.plannedDate) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="96" fixed="right">
                <template #default="{ row }">
                  <el-button text @click="openDetailDrawer('paymentPlan', row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane name="paymentRecords">
          <template #label>
            <span class="tab-label">
              <span>回款记录</span>
              <strong class="tab-count">{{ activeOverview.paymentRecords.length }}</strong>
            </span>
          </template>

          <div class="table-toolbar">
            <span class="table-caption">实际到账记录</span>
            <el-button text :disabled="paymentPlanOptions.length === 0" @click="openPaymentRecordDrawer">
              登记回款
            </el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="activeOverview.paymentRecords" stripe empty-text="当前上下文暂无回款记录">
              <el-table-column label="回款金额" min-width="140">
                <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="回款时间" min-width="180">
                <template #default="{ row }">{{ formatDateTime(row.receivedAt) }}</template>
              </el-table-column>
              <el-table-column prop="note" label="说明" min-width="260" show-overflow-tooltip />
              <el-table-column label="操作" width="96" fixed="right">
                <template #default="{ row }">
                  <el-button text @click="openDetailDrawer('paymentRecord', row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane name="renewalReminders">
          <template #label>
            <span class="tab-label">
              <span>续费提醒</span>
              <strong class="tab-count">{{ activeOverview.renewalReminders.length }}</strong>
            </span>
          </template>

          <div class="table-toolbar">
            <span class="table-caption">到期与复购跟进窗口</span>
            <el-button text :disabled="contractOptions.length === 0 || !selectedCustomer" @click="openRenewalReminderDrawer">
              创建续费提醒
            </el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="activeOverview.renewalReminders" stripe empty-text="当前上下文暂无续费提醒">
              <el-table-column prop="title" label="提醒标题" min-width="240" />
              <el-table-column label="提醒时间" min-width="180">
                <template #default="{ row }">{{ formatDateTime(row.remindAt) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="120">
                <template #default="{ row }">{{ formatRenewalReminderStatus(row.status) }}</template>
              </el-table-column>
              <el-table-column prop="note" label="说明" min-width="260" show-overflow-tooltip />
              <el-table-column label="操作" width="96" fixed="right">
                <template #default="{ row }">
                  <el-button text @click="openDetailDrawer('renewalReminder', row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section v-else class="page-card empty-card">
      <el-empty description="请选择客户，或从客户/商机上下文进入经营闭环。" />
    </section>

    <el-drawer
      v-model="workspaceDrawerVisible"
      :title="workspaceDrawerTitle"
      :size="isTabletOrDown ? '100%' : 'min(960px, calc(100vw - 32px))'"
      append-to-body
      destroy-on-close
    >
      <div class="drawer-stack">
        <section class="page-card drawer-context-card">
          <div class="drawer-context-head">
            <div>
              <h3>{{ workspaceDrawerTitle }}</h3>
              <p>{{ workspaceDrawerDescription }}</p>
            </div>
            <el-tag type="info">{{ activeContextLabel }}</el-tag>
          </div>

          <div class="drawer-context-grid">
            <article class="drawer-context-item">
              <span>客户</span>
              <strong>{{ selectedCustomer?.name ?? "未选择" }}</strong>
            </article>
            <article class="drawer-context-item">
              <span>商机</span>
              <strong>{{ selectedOpportunity?.name ?? "未选择" }}</strong>
            </article>
          </div>
        </section>

        <section class="page-card drawer-form-card">
          <el-form
            v-if="workspaceDrawerMode === 'quote'"
            :ref="setQuoteFormRef"
            :model="quoteForm"
            :rules="quoteRules"
            label-position="top"
            require-asterisk-position="right"
            status-icon
            class="drawer-form dialog-form"
          >
            <el-form-item label="报价标题" prop="title" required>
              <el-input v-model="quoteForm.title" placeholder="请输入报价标题" />
            </el-form-item>
            <el-form-item label="报价金额" prop="amount" required>
              <el-input-number v-model="quoteForm.amount" :min="0" :step="1000" class="full-width" />
            </el-form-item>
            <div class="dialog-grid">
              <el-form-item label="出具时间" prop="issuedAt">
                <el-date-picker
                  v-model="quoteForm.issuedAt"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                  class="full-width"
                />
              </el-form-item>
              <el-form-item label="失效时间" prop="expiresAt">
                <el-date-picker
                  v-model="quoteForm.expiresAt"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                  class="full-width"
                />
              </el-form-item>
            </div>
            <el-form-item label="备注" prop="notes">
              <el-input v-model="quoteForm.notes" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>

          <el-form
            v-else-if="workspaceDrawerMode === 'contract'"
            :ref="setContractFormRef"
            :model="contractForm"
            :rules="contractRules"
            label-position="top"
            require-asterisk-position="right"
            status-icon
            class="drawer-form dialog-form"
          >
            <el-form-item label="合同标题" prop="title" required>
              <el-input v-model="contractForm.title" placeholder="请输入合同标题" />
            </el-form-item>
            <el-form-item label="合同金额" prop="amount" required>
              <el-input-number v-model="contractForm.amount" :min="0" :step="1000" class="full-width" />
            </el-form-item>
            <div class="dialog-grid">
              <el-form-item label="开始时间" prop="startDate" required>
                <el-date-picker
                  v-model="contractForm.startDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  class="full-width"
                />
              </el-form-item>
              <el-form-item label="结束时间" prop="endDate" required>
                <el-date-picker
                  v-model="contractForm.endDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  class="full-width"
                />
              </el-form-item>
            </div>
            <el-form-item label="签署时间" prop="signedAt">
              <el-date-picker
                v-model="contractForm.signedAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="备注" prop="notes">
              <el-input v-model="contractForm.notes" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>

          <el-form
            v-else-if="workspaceDrawerMode === 'paymentPlan'"
            :ref="setPaymentPlanFormRef"
            :model="paymentPlanForm"
            :rules="paymentPlanRules"
            label-position="top"
            require-asterisk-position="right"
            status-icon
            class="drawer-form dialog-form"
          >
            <el-form-item label="计划标题" prop="title" required>
              <el-input v-model="paymentPlanForm.title" placeholder="请输入回款计划标题" />
            </el-form-item>
            <el-form-item label="计划金额" prop="plannedAmount" required>
              <el-input-number v-model="paymentPlanForm.plannedAmount" :min="0" :step="1000" class="full-width" />
            </el-form-item>
            <div class="dialog-grid">
              <el-form-item label="计划日期" prop="plannedDate" required>
                <el-date-picker
                  v-model="paymentPlanForm.plannedDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  class="full-width"
                />
              </el-form-item>
              <el-form-item label="关联合同" prop="contractId">
                <el-select v-model="paymentPlanForm.contractId" clearable placeholder="可选：关联已有合同" class="full-width">
                  <el-option v-for="item in contractOptions" :key="item.id" :label="item.title" :value="item.id" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="备注" prop="notes">
              <el-input v-model="paymentPlanForm.notes" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>

          <el-form
            v-else-if="workspaceDrawerMode === 'paymentRecord'"
            :ref="setPaymentRecordFormRef"
            :model="paymentRecordForm"
            :rules="paymentRecordRules"
            label-position="top"
            require-asterisk-position="right"
            status-icon
            class="drawer-form dialog-form"
          >
            <el-form-item label="回款计划" prop="paymentPlanId" required>
              <el-select v-model="paymentRecordForm.paymentPlanId" placeholder="请选择回款计划" class="full-width">
                <el-option v-for="item in paymentPlanOptions" :key="item.id" :label="item.title" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="实际回款金额" prop="amount" required>
              <el-input-number v-model="paymentRecordForm.amount" :min="0" :step="1000" class="full-width" />
            </el-form-item>
            <el-form-item label="实际回款时间" prop="receivedAt" required>
              <el-date-picker
                v-model="paymentRecordForm.receivedAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="说明" prop="note">
              <el-input v-model="paymentRecordForm.note" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>

          <el-form
            v-else
            :ref="setRenewalReminderFormRef"
            :model="renewalReminderForm"
            :rules="renewalReminderRules"
            label-position="top"
            require-asterisk-position="right"
            status-icon
            class="drawer-form dialog-form"
          >
            <el-form-item label="提醒标题" prop="title" required>
              <el-input v-model="renewalReminderForm.title" placeholder="请输入提醒标题" />
            </el-form-item>
            <el-form-item label="关联合同" prop="contractId" required>
              <el-select v-model="renewalReminderForm.contractId" placeholder="请选择关联合同" class="full-width">
                <el-option v-for="item in contractOptions" :key="item.id" :label="item.title" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="提醒时间" prop="remindAt" required>
              <el-date-picker
                v-model="renewalReminderForm.remindAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="说明" prop="note">
              <el-input v-model="renewalReminderForm.note" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>

          <div class="drawer-form-actions">
            <el-button @click="closeWorkspaceDrawer">取消</el-button>
            <el-button v-if="workspaceDrawerMode === 'quote'" type="primary" :loading="isSubmitting" @click="submitQuote">
              保存
            </el-button>
            <el-button
              v-else-if="workspaceDrawerMode === 'contract'"
              type="primary"
              :loading="isSubmitting"
              @click="submitContract"
            >
              保存
            </el-button>
            <el-button
              v-else-if="workspaceDrawerMode === 'paymentPlan'"
              type="primary"
              :loading="isSubmitting"
              @click="submitPaymentPlan"
            >
              保存
            </el-button>
            <el-button
              v-else-if="workspaceDrawerMode === 'paymentRecord'"
              type="primary"
              :loading="isSubmitting"
              @click="submitPaymentRecord"
            >
              保存
            </el-button>
            <el-button v-else type="primary" :loading="isSubmitting" @click="submitRenewalReminder">保存</el-button>
          </div>
        </section>
      </div>
    </el-drawer>

    <RevenueOperationDetailDrawer
      v-model:visible="detailDrawerVisible"
      :type="detailDrawerType"
      :record="selectedDetailRecord"
      :is-tablet-or-down="isTabletOrDown"
      :customer-name="selectedCustomer?.name ?? ''"
      :opportunity-name="selectedOpportunity?.name ?? ''"
      :contract-title-map="contractTitleMap"
      :payment-plan-title-map="paymentPlanTitleMap"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { useRevenueOperationsPage } from "@/composables/revenue-operations/useRevenueOperationsPage";
import RevenueOperationDetailDrawer from "@/pages/revenue-operations/components/RevenueOperationDetailDrawer.vue";
import { formatAmount, formatContractStatus, formatDateTime, formatPaymentPlanStatus, formatQuoteStatus, formatRenewalReminderStatus } from "@/utils/display";

const activeTab = ref("quotes");

const {
  activeContextLabel,
  activeOverview,
  canCreateOpportunityScopedItems,
  closeWorkspaceDrawer,
  contractOptions,
  contractForm,
  contractRules,
  customers,
  detailDrawerType,
  detailDrawerVisible,
  handleCustomerChange,
  handleOpportunityChange,
  isContextLoading,
  isMetaLoading,
  isSubmitting,
  isTabletOrDown,
  openContractDrawer,
  openDetailDrawer,
  openPaymentPlanDrawer,
  openPaymentRecordDrawer,
  openQuoteDrawer,
  openRenewalReminderDrawer,
  paymentPlanForm,
  paymentPlanOptions,
  paymentPlanRules,
  paymentRecordForm,
  paymentRecordRules,
  quoteForm,
  quoteRules,
  refreshContext,
  renewalReminderForm,
  renewalReminderRules,
  selectedCustomer,
  selectedCustomerId,
  selectedDetailRecord,
  selectedOpportunity,
  selectedOpportunityId,
  setContractFormRef,
  setPaymentPlanFormRef,
  setPaymentRecordFormRef,
  setQuoteFormRef,
  setRenewalReminderFormRef,
  summaryCards,
  submitContract,
  submitPaymentPlan,
  submitPaymentRecord,
  submitQuote,
  submitRenewalReminder,
  wonOpportunities,
  workspaceDrawerDescription,
  workspaceDrawerMode,
  workspaceDrawerTitle,
  workspaceDrawerVisible
} = useRevenueOperationsPage();

const contractTitleMap = computed<Record<string, string>>(() =>
  Object.fromEntries((activeOverview.value?.contracts ?? []).map((item) => [item.id, item.title]))
);

const paymentPlanTitleMap = computed<Record<string, string>>(() =>
  Object.fromEntries((activeOverview.value?.paymentPlans ?? []).map((item) => [item.id, item.title]))
);

function formatSummaryValue(value: number, formatAs: "amount" | "count"): string {
  return formatAs === "amount" ? formatAmount(value) : value.toLocaleString("zh-CN");
}
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}

.workspace-card,
.operations-card,
.empty-card,
.drawer-context-card,
.drawer-form-card {
  display: grid;
  gap: 18px;
}

.workspace-header,
.section-heading,
.workspace-actions,
.table-toolbar,
.drawer-context-head,
.drawer-form-actions {
  display: flex;
  gap: 12px;
}

.workspace-header,
.section-heading,
.table-toolbar,
.drawer-context-head {
  justify-content: space-between;
  align-items: flex-start;
}

.workspace-actions {
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.section-caption {
  margin: 4px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.context-grid,
.drawer-context-grid,
.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.context-field,
.context-field :deep(.el-select) {
  display: grid;
  gap: 8px;
  width: 100%;
}

.context-label {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.context-overview,
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.context-pill,
.summary-card,
.drawer-context-item {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.context-pill span,
.summary-card span,
.summary-card small,
.drawer-context-item span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.context-pill strong,
.drawer-context-item strong {
  color: var(--app-text-primary);
  font-size: 16px;
  line-height: 1.5;
}

.summary-card strong {
  color: var(--app-text-primary);
  font-size: 24px;
  line-height: 1.2;
}

.context-notice {
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
  font-size: 13px;
  line-height: 1.6;
}

.shortcut-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.operations-tabs {
  min-width: 0;
}

.operations-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.tab-count {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--app-accent-strong);
  font-size: 12px;
  line-height: 24px;
  text-align: center;
}

.table-toolbar {
  margin-bottom: 12px;
  align-items: center;
}

.table-caption {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.drawer-stack {
  display: grid;
  gap: 16px;
}

.drawer-context-head h3 {
  margin: 0;
  color: var(--app-text-primary);
}

.drawer-context-head p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.drawer-form {
  display: grid;
}

.drawer-form-actions {
  justify-content: flex-end;
}

.full-width,
.full-width :deep(.el-input__wrapper) {
  width: 100%;
}

@media (max-width: 960px) {
  .workspace-header,
  .section-heading,
  .workspace-actions,
  .table-toolbar,
  .drawer-context-head {
    flex-direction: column;
    align-items: stretch;
  }

  .context-grid,
  .drawer-context-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
