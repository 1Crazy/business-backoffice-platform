<!-- 行政申请页面：负责发起多类型行政申请，并在侧栏回看最近申请。 -->
<template>
  <div class="page-grid">
    <section class="page-card form-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">高频事务</span>
          <h2 class="page-section-title">发起行政申请</h2>
        </div>
        <p class="page-section-caption">统一提交报销、出差、采购和用印申请。</p>
      </div>

      <div class="type-switcher" role="tablist" aria-label="行政申请类型">
        <button
          v-for="type in requestTypes"
          :key="type"
          type="button"
          class="type-chip"
          :class="{ active: form.type === type }"
          @click="handleTypeChange(type)"
        >
          {{ formatAdministrativeRequestType(type) }}
        </button>
      </div>

      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <div class="form-grid">
          <el-form-item label="申请标题" prop="title" required>
            <el-input v-model="form.title" maxlength="80" placeholder="例如：华东客户拜访交通报销" />
          </el-form-item>

          <el-form-item label="附件名称" prop="attachmentNames">
            <el-select
              v-model="form.attachmentNames"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入后回车，可录入多个附件名"
            />
          </el-form-item>
        </div>

        <section class="form-section">
          <h3>结构化信息</h3>

          <template v-if="form.type === 'REIMBURSEMENT'">
            <div class="form-grid">
              <el-form-item label="报销日期" prop="expenseDate" required>
                <el-date-picker v-model="form.expenseDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择报销日期" />
              </el-form-item>
              <el-form-item label="报销类别" prop="expenseCategory" required>
                <el-input v-model="form.expenseCategory" maxlength="50" placeholder="例如：差旅交通、住宿、餐补" />
              </el-form-item>
              <el-form-item label="报销金额" prop="amount" required>
                <el-input-number
                  v-model="form.amount"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  class="number-field"
                  placeholder="请输入报销金额（元）"
                />
                <p class="field-hint">单位为元，可保留两位小数。</p>
              </el-form-item>
              <el-form-item label="报销对象" prop="payeeName" required>
                <el-input v-model="form.payeeName" maxlength="50" placeholder="请输入收款对象或报销对象" />
              </el-form-item>
            </div>
          </template>

          <template v-else-if="form.type === 'TRAVEL'">
            <div class="form-grid">
              <el-form-item label="出差开始时间" prop="startAt" required>
                <el-date-picker
                  v-model="form.startAt"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择开始时间"
                />
              </el-form-item>
              <el-form-item label="出差结束时间" prop="endAt" required>
                <el-date-picker
                  v-model="form.endAt"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择结束时间"
                />
              </el-form-item>
              <el-form-item label="出差目的地" prop="destination" required>
                <el-input v-model="form.destination" maxlength="100" placeholder="例如：上海、杭州客户现场" />
              </el-form-item>
              <el-form-item label="交通方式" prop="transportation" required>
                <el-input v-model="form.transportation" maxlength="40" placeholder="例如：高铁、飞机、自驾" />
              </el-form-item>
              <el-form-item label="预估费用" prop="estimatedAmount" required>
                <el-input-number
                  v-model="form.estimatedAmount"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  class="number-field"
                  placeholder="请输入预估费用（元）"
                />
                <p class="field-hint">单位为元，用于审批阶段预算评估。</p>
              </el-form-item>
            </div>
          </template>

          <template v-else-if="form.type === 'PURCHASE'">
            <div class="form-grid">
              <el-form-item label="采购物品" prop="itemName" required>
                <el-input v-model="form.itemName" maxlength="100" placeholder="请输入采购物品或服务名称" />
              </el-form-item>
              <el-form-item label="采购数量" prop="quantity" required>
                <el-input-number
                  v-model="form.quantity"
                  :min="1"
                  :precision="0"
                  :controls="false"
                  class="number-field"
                  placeholder="请输入采购数量"
                />
                <p class="field-hint">仅支持正整数。</p>
              </el-form-item>
              <el-form-item label="预算金额" prop="budgetAmount" required>
                <el-input-number
                  v-model="form.budgetAmount"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  class="number-field"
                  placeholder="请输入预算金额（元）"
                />
                <p class="field-hint">单位为元，可保留两位小数。</p>
              </el-form-item>
              <el-form-item label="期望到位时间" prop="neededBy" required>
                <el-date-picker
                  v-model="form.neededBy"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择期望到位时间"
                />
              </el-form-item>
            </div>
          </template>

          <template v-else>
            <div class="form-grid">
              <el-form-item label="文件名称" prop="documentName" required>
                <el-input v-model="form.documentName" maxlength="100" placeholder="请输入需要用印的文件名称" />
              </el-form-item>
              <el-form-item label="用印类型" prop="sealType" required>
                <el-input v-model="form.sealType" maxlength="50" placeholder="例如：合同章、公章、财务章" />
              </el-form-item>
              <el-form-item label="用印时间" prop="useDate" required>
                <el-date-picker v-model="form.useDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择用印时间" />
              </el-form-item>
              <el-form-item label="用印份数" prop="copyCount" required>
                <el-input-number
                  v-model="form.copyCount"
                  :min="1"
                  :precision="0"
                  :controls="false"
                  class="number-field"
                  placeholder="请输入用印份数"
                />
                <p class="field-hint">请输入需要盖章的文件份数。</p>
              </el-form-item>
            </div>
          </template>
        </section>

        <el-form-item label="申请说明" prop="reason" required>
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请补充业务背景、审批诉求和必要说明"
          />
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" :loading="submitting" @click="submit">提交行政申请</el-button>
        </div>
      </el-form>
    </section>

    <section class="page-card recent-card">
      <div class="section-head compact">
        <div>
          <span class="page-kicker">最近申请</span>
          <h2 class="page-section-title">我的最近行政申请</h2>
        </div>
        <p class="page-section-caption">刚提交或正在流转的申请会在这里出现。</p>
      </div>

      <div v-if="!isRecentLoading && recentRequests.length" class="recent-list">
        <article v-for="item in recentRequests.slice(0, 5)" :key="item.id" class="recent-item">
          <div class="recent-top">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ formatAdministrativeRequestType(item.type) }} · {{ item.requestNo }}</p>
            </div>
            <span class="status-pill" :class="item.status.toLowerCase()">
              {{ formatAdministrativeRequestStatus(item.status) }}
            </span>
          </div>
          <p class="recent-summary">{{ item.summary }}</p>
          <div class="recent-meta">
            <span>审批人：{{ item.approverName || "待分配" }}</span>
            <span>提交于：{{ formatDateTime(item.submittedAt) }}</span>
          </div>
          <el-button text @click="openAdministrativeRequestDetail(item.id)">查看详情</el-button>
        </article>
      </div>

      <div v-else-if="isRecentLoading" class="recent-list">
        <article v-for="item in 3" :key="item" class="recent-item skeleton-card">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <span class="ui-skeleton ui-skeleton-line short" />
        </article>
      </div>

      <el-empty v-else description="最近还没有行政申请记录" />
    </section>

    <AdministrativeRequestDetailDrawer
      v-model:visible="drawerVisible"
      :request="request"
      :is-loading="isRequestLoading"
      :is-tablet-or-down="isTabletOrDown"
    />
  </div>
</template>

<script setup lang="ts">
import { useAdministrativeRequestDetailDrawer } from "@/composables/administrative-requests/useAdministrativeRequestDetailDrawer";
import { useAdministrativeRequestPage } from "@/composables/administrative-requests/useAdministrativeRequestPage";
import AdministrativeRequestDetailDrawer from "@/pages/administrative-requests/components/AdministrativeRequestDetailDrawer.vue";
import {
  formatAdministrativeRequestStatus,
  formatAdministrativeRequestType,
  formatDateTime
} from "@/utils/display";

const { form, handleTypeChange, isRecentLoading, recentRequests, requestTypes, rules, setFormRef, submit, submitting } =
  useAdministrativeRequestPage();
const {
  drawerVisible,
  isLoading: isRequestLoading,
  isTabletOrDown,
  openAdministrativeRequestDetail,
  request
} = useAdministrativeRequestDetailDrawer();
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
}

.form-card,
.recent-card {
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
  max-width: 360px;
  margin: 0;
}

.type-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-chip {
  border: 1px solid rgba(125, 148, 171, 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: var(--app-text-secondary);
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.type-chip.active {
  color: var(--app-accent-strong);
  border-color: rgba(37, 99, 235, 0.24);
  background: rgba(219, 234, 254, 0.8);
}

.type-chip:hover {
  transform: translateY(-1px);
}

.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-section {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(148, 163, 184, 0.08);
}

.form-section h3 {
  margin: 0;
  font-size: 14px;
}

.number-field {
  width: 100%;
}

.field-hint {
  margin: 6px 0 0;
  color: var(--app-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(125, 148, 171, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

.recent-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.recent-top p,
.recent-summary {
  margin: 8px 0 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.recent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.recent-item :deep(.el-button) {
  align-self: flex-start;
}

.skeleton-card {
  display: grid;
  gap: 10px;
}

@media (max-width: 1080px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-head,
  .recent-top {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
