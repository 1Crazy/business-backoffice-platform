<!-- 经营对象详情抽屉：统一承载报价、合同、回款与续费的查看视图，避免跳出额外详情页。 -->
<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    :size="isTabletOrDown ? '100%' : 'min(900px, calc(100vw - 32px))'"
    append-to-body
    destroy-on-close
  >
    <template v-if="record">
      <div class="drawer-stack">
        <section class="page-card summary-panel">
          <div class="summary-header">
            <div>
              <h3>{{ summaryTitle }}</h3>
              <p>{{ summarySubtitle }}</p>
            </div>
            <div class="tag-stack">
              <el-tag type="info">{{ entityLabel }}</el-tag>
              <el-tag :type="statusTagType">{{ statusText }}</el-tag>
            </div>
          </div>

          <div class="metric-grid">
            <article v-for="item in primaryMetrics" :key="item.label" class="metric-card">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>
        </section>

        <section class="page-card detail-panel">
          <div class="panel-title">详细信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item
              v-for="item in detailFields"
              :key="item.label"
              :label="item.label"
              :span="item.span ?? 1"
            >
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section v-if="recordNote" class="page-card note-panel">
          <div class="panel-title">补充说明</div>
          <p>{{ recordNote }}</p>
        </section>

        <section class="page-card detail-panel">
          <div class="panel-title">上下文信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item
              v-for="item in contextFields"
              :key="item.label"
              :label="item.label"
              :span="item.span ?? 1"
            >
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
        </section>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type {
  Contract,
  PaymentPlan,
  PaymentRecord,
  Quote,
  RenewalReminder,
  RevenueOperationDetailType,
  RevenueOperationRecord
} from "@/types/revenue-operations";
import {
  formatAmount,
  formatContractStatus,
  formatDateTime,
  formatPaymentPlanStatus,
  formatQuoteStatus,
  formatRenewalReminderStatus
} from "@/utils/display";

interface DetailField {
  label: string;
  value: string;
  span?: 1 | 2;
}

interface SummaryMetric {
  label: string;
  value: string;
}

const props = defineProps<{
  visible: boolean;
  type: RevenueOperationDetailType;
  record: RevenueOperationRecord | null;
  isTabletOrDown: boolean;
  customerName: string;
  opportunityName: string;
  contractTitleMap: Record<string, string>;
  paymentPlanTitleMap: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});

const drawerTitle = computed(() => {
  const titleMap: Record<RevenueOperationDetailType, string> = {
    quote: "报价详情",
    contract: "合同详情",
    paymentPlan: "回款计划详情",
    paymentRecord: "回款记录详情",
    renewalReminder: "续费提醒详情"
  };

  return titleMap[props.type];
});

const entityLabel = computed(() => drawerTitle.value.replace("详情", ""));

function resolveContractTitle(contractId?: string | null): string {
  if (!contractId) {
    return "-";
  }

  return props.contractTitleMap[contractId] ?? "已关联合同";
}

function resolvePaymentPlanTitle(paymentPlanId?: string | null): string {
  if (!paymentPlanId) {
    return "-";
  }

  return props.paymentPlanTitleMap[paymentPlanId] ?? "已关联回款计划";
}

const summaryTitle = computed(() => {
  if (!props.record) {
    return "-";
  }

  switch (props.type) {
    case "quote":
      return (props.record as Quote).title;
    case "contract":
      return (props.record as Contract).title;
    case "paymentPlan":
      return (props.record as PaymentPlan).title;
    case "paymentRecord":
      return "已登记回款";
    case "renewalReminder":
      return (props.record as RenewalReminder).title;
  }
});

const summarySubtitle = computed(() => {
  if (!props.record) {
    return "-";
  }

  switch (props.type) {
    case "quote": {
      const record = props.record as Quote;
      return `报价编号 ${record.quoteNo}`;
    }
    case "contract": {
      const record = props.record as Contract;
      return `合同编号 ${record.contractNo}`;
    }
    case "paymentPlan": {
      const record = props.record as PaymentPlan;
      return record.contractId ? `关联合同 ${resolveContractTitle(record.contractId)}` : "未关联合同";
    }
    case "paymentRecord": {
      const record = props.record as PaymentRecord;
      return `回款计划 ${resolvePaymentPlanTitle(record.paymentPlanId)}`;
    }
    case "renewalReminder": {
      const record = props.record as RenewalReminder;
      return `关联合同 ${resolveContractTitle(record.contractId)}`;
    }
  }
});

const statusText = computed(() => {
  if (!props.record) {
    return "-";
  }

  switch (props.type) {
    case "quote":
      return formatQuoteStatus((props.record as Quote).status);
    case "contract":
      return formatContractStatus((props.record as Contract).status);
    case "paymentPlan":
      return formatPaymentPlanStatus((props.record as PaymentPlan).status);
    case "paymentRecord":
      return "已登记";
    case "renewalReminder":
      return formatRenewalReminderStatus((props.record as RenewalReminder).status);
  }
});

const statusTagType = computed<"success" | "warning" | "info" | "danger">(() => {
  if (!props.record) {
    return "info";
  }

  if (props.type === "paymentRecord") {
    return "success";
  }

  const status = "status" in props.record ? props.record.status : "";

  if (status === "ACTIVE" || status === "PAID" || status === "COMPLETED" || status === "ACCEPTED") {
    return "success";
  }

  if (status === "OVERDUE" || status === "REJECTED") {
    return "danger";
  }

  if (status === "PENDING" || status === "PARTIAL" || status === "SENT" || status === "CONTACTED") {
    return "warning";
  }

  return "info";
});

const primaryMetrics = computed<SummaryMetric[]>(() => {
  if (!props.record) {
    return [];
  }

  switch (props.type) {
    case "quote": {
      const record = props.record as Quote;

      return [
        { label: "报价金额", value: formatAmount(record.amount) },
        { label: "有效期", value: formatDateTime(record.expiresAt || record.issuedAt) }
      ];
    }
    case "contract": {
      const record = props.record as Contract;

      return [
        { label: "合同金额", value: formatAmount(record.amount) },
        { label: "结束时间", value: formatDateTime(record.endDate) }
      ];
    }
    case "paymentPlan": {
      const record = props.record as PaymentPlan;

      return [
        { label: "计划金额", value: formatAmount(record.plannedAmount) },
        { label: "已回金额", value: formatAmount(record.receivedAmount) }
      ];
    }
    case "paymentRecord": {
      const record = props.record as PaymentRecord;

      return [
        { label: "回款金额", value: formatAmount(record.amount) },
        { label: "回款时间", value: formatDateTime(record.receivedAt) }
      ];
    }
    case "renewalReminder": {
      const record = props.record as RenewalReminder;

      return [
        { label: "提醒时间", value: formatDateTime(record.remindAt) },
        { label: "当前状态", value: formatRenewalReminderStatus(record.status) }
      ];
    }
  }
});

const detailFields = computed<DetailField[]>(() => {
  if (!props.record) {
    return [];
  }

  switch (props.type) {
    case "quote": {
      const record = props.record as Quote;

      return [
        { label: "报价编号", value: record.quoteNo },
        { label: "状态", value: formatQuoteStatus(record.status) },
        { label: "出具时间", value: formatDateTime(record.issuedAt) },
        { label: "失效时间", value: formatDateTime(record.expiresAt) }
      ];
    }
    case "contract": {
      const record = props.record as Contract;

      return [
        { label: "合同编号", value: record.contractNo },
        { label: "状态", value: formatContractStatus(record.status) },
        { label: "开始时间", value: formatDateTime(record.startDate) },
        { label: "结束时间", value: formatDateTime(record.endDate) },
        { label: "签署时间", value: formatDateTime(record.signedAt) },
        { label: "合同金额", value: formatAmount(record.amount) }
      ];
    }
    case "paymentPlan": {
      const record = props.record as PaymentPlan;

      return [
        { label: "计划金额", value: formatAmount(record.plannedAmount) },
        { label: "已回金额", value: formatAmount(record.receivedAmount) },
        { label: "未回金额", value: formatAmount(record.plannedAmount - record.receivedAmount) },
        { label: "计划日期", value: formatDateTime(record.plannedDate) },
        { label: "状态", value: formatPaymentPlanStatus(record.status) },
        { label: "关联合同", value: resolveContractTitle(record.contractId) }
      ];
    }
    case "paymentRecord": {
      const record = props.record as PaymentRecord;

      return [
        { label: "回款金额", value: formatAmount(record.amount) },
        { label: "回款时间", value: formatDateTime(record.receivedAt) },
        { label: "回款计划", value: resolvePaymentPlanTitle(record.paymentPlanId) },
        { label: "关联合同", value: resolveContractTitle(record.contractId) }
      ];
    }
    case "renewalReminder": {
      const record = props.record as RenewalReminder;

      return [
        { label: "提醒时间", value: formatDateTime(record.remindAt) },
        { label: "当前状态", value: formatRenewalReminderStatus(record.status) },
        { label: "关联合同", value: resolveContractTitle(record.contractId) },
        { label: "关联商机", value: record.opportunityId ? props.opportunityName || "当前商机" : "-" }
      ];
    }
  }
});

const recordNote = computed(() => {
  if (!props.record) {
    return "";
  }

  if ("notes" in props.record) {
    return props.record.notes ?? "";
  }

  if ("note" in props.record) {
    return props.record.note ?? "";
  }

  return "";
});

const contextFields = computed<DetailField[]>(() => {
  if (!props.record) {
    return [];
  }

  return [
    { label: "客户", value: props.customerName || "当前客户" },
    { label: "商机", value: props.record.opportunityId ? props.opportunityName || "当前商机" : "-" },
    { label: "创建时间", value: formatDateTime(props.record.createdAt) },
    { label: "更新时间", value: formatDateTime(props.record.updatedAt) }
  ];
});
</script>

<style scoped>
.drawer-stack {
  display: grid;
  gap: 20px;
}

.summary-panel,
.detail-panel,
.note-panel {
  display: grid;
  gap: 16px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.summary-header h3,
.panel-title {
  margin: 0;
  color: var(--app-text-primary);
}

.summary-header p {
  margin: 6px 0 0;
  color: var(--app-text-secondary);
}

.tag-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.metric-card span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.metric-card strong {
  color: var(--app-text-primary);
  font-size: 24px;
  line-height: 1.2;
}

.note-panel p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 960px) {
  .summary-header {
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
