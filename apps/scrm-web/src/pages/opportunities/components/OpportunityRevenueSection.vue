<template>
  <section class="revenue-panel">
    <div class="panel-head">
      <div class="panel-title">成交后经营</div>
      <el-button type="primary" plain :disabled="opportunity.resultStatus !== 'WON'" @click="emit('open-revenue-workspace')">
        进入经营闭环
      </el-button>
    </div>

    <div class="revenue-grid">
      <OpportunityRevenueGroup title="报价" :count="opportunity.quotes?.length ?? 0">
        <div v-if="opportunity.quotes?.length" class="summary-list">
          <div v-for="item in opportunity.quotes" :key="item.id" class="summary-card">
            <div class="summary-card-head">
              <strong>{{ item.quoteNo }}</strong>
              <span>{{ formatQuoteStatus(item.status) }}</span>
            </div>
            <p>{{ item.title }}</p>
            <div class="summary-card-meta">
              <span>{{ formatAmount(item.amount) }}</span>
              <span>{{ formatDateTime(item.expiresAt || item.issuedAt) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无报价" />
      </OpportunityRevenueGroup>

      <OpportunityRevenueGroup title="合同" :count="opportunity.contracts?.length ?? 0">
        <div v-if="opportunity.contracts?.length" class="summary-list">
          <div v-for="item in opportunity.contracts" :key="item.id" class="summary-card">
            <div class="summary-card-head">
              <strong>{{ item.contractNo }}</strong>
              <span>{{ formatContractStatus(item.status) }}</span>
            </div>
            <p>{{ item.title }}</p>
            <div class="summary-card-meta">
              <span>{{ formatAmount(item.amount) }}</span>
              <span>{{ formatDateTime(item.endDate) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无合同" />
      </OpportunityRevenueGroup>

      <OpportunityRevenueGroup title="回款计划" :count="opportunity.paymentPlans?.length ?? 0">
        <div v-if="opportunity.paymentPlans?.length" class="summary-list">
          <div v-for="item in opportunity.paymentPlans" :key="item.id" class="summary-card">
            <div class="summary-card-head">
              <strong>{{ item.title }}</strong>
              <span>{{ formatPaymentPlanStatus(item.status) }}</span>
            </div>
            <div class="summary-card-meta">
              <span>计划 {{ formatAmount(item.plannedAmount) }}</span>
              <span>已回 {{ formatAmount(item.receivedAmount) }}</span>
            </div>
            <div class="summary-card-meta">
              <span>{{ formatDateTime(item.plannedDate) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无回款计划" />
      </OpportunityRevenueGroup>

      <OpportunityRevenueGroup title="回款记录" :count="opportunity.paymentRecords?.length ?? 0">
        <div v-if="opportunity.paymentRecords?.length" class="summary-list">
          <div v-for="item in opportunity.paymentRecords" :key="item.id" class="summary-card">
            <div class="summary-card-head">
              <strong>{{ formatAmount(item.amount) }}</strong>
              <span>{{ formatDateTime(item.receivedAt) }}</span>
            </div>
            <p>{{ item.note || "已登记回款" }}</p>
          </div>
        </div>
        <el-empty v-else description="暂无回款记录" />
      </OpportunityRevenueGroup>

      <OpportunityRevenueGroup title="续费提醒" :count="opportunity.renewalReminders?.length ?? 0">
        <div v-if="opportunity.renewalReminders?.length" class="summary-list">
          <div v-for="item in opportunity.renewalReminders" :key="item.id" class="summary-card">
            <div class="summary-card-head">
              <strong>{{ item.title }}</strong>
              <span>{{ formatRenewalReminderStatus(item.status) }}</span>
            </div>
            <div class="summary-card-meta">
              <span>{{ formatDateTime(item.remindAt) }}</span>
            </div>
            <p v-if="item.note">{{ item.note }}</p>
          </div>
        </div>
        <el-empty v-else description="暂无续费提醒" />
      </OpportunityRevenueGroup>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Opportunity } from "@/types/opportunities";
import {
  formatAmount,
  formatContractStatus,
  formatDateTime,
  formatPaymentPlanStatus,
  formatQuoteStatus,
  formatRenewalReminderStatus
} from "@/utils/display";

import OpportunityRevenueGroup from "./OpportunityRevenueGroup.vue";

defineProps<{
  opportunity: Opportunity;
}>();

const emit = defineEmits<{
  "open-revenue-workspace": [];
}>();
</script>

<style scoped>
.revenue-panel {
  display: grid;
  gap: 16px;
}

.revenue-grid {
  display: grid;
  gap: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.summary-list {
  display: grid;
  gap: 10px;
}

.summary-card {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(95, 125, 170, 0.12);
}

.summary-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.summary-card p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.summary-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--app-text-secondary);
  font-size: 12px;
}
</style>
