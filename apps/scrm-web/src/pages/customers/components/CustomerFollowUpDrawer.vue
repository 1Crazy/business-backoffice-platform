<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-drawer
    v-model="drawerVisible"
    :size="isTabletOrDown ? '100%' : '58%'"
    :title="customer?.name ?? '客户跟进'"
    append-to-body
  >
    <div class="drawer-stack">
      <section v-if="customer" class="page-card">
        <div class="drawer-head drawer-head-row">
          <div>
            <h3>经营闭环摘要</h3>
            <p>在客户上下文里查看报价、合同、回款与续费状态。</p>
          </div>
          <el-button type="primary" plain @click="$emit('open-revenue')">进入经营闭环</el-button>
        </div>

        <div v-if="revenueOverview" class="revenue-grid">
          <article class="revenue-card">
            <span>报价单</span>
            <strong>{{ revenueOverview.quotes.length }}</strong>
            <small>{{ revenueOverview.quotes[0]?.title ?? "暂无报价" }}</small>
          </article>
          <article class="revenue-card">
            <span>合同</span>
            <strong>{{ revenueOverview.contracts.length }}</strong>
            <small>{{ revenueOverview.contracts[0]?.title ?? "暂无合同" }}</small>
          </article>
          <article class="revenue-card">
            <span>回款计划</span>
            <strong>{{ revenueOverview.paymentPlans.length }}</strong>
            <small>{{ revenueOverview.paymentPlans[0]?.title ?? "暂无回款计划" }}</small>
          </article>
          <article class="revenue-card">
            <span>回款记录</span>
            <strong>{{ revenueOverview.paymentRecords.length }}</strong>
            <small>{{ revenueOverview.paymentRecords[0]?.note ?? "暂无回款记录" }}</small>
          </article>
          <article class="revenue-card">
            <span>续费提醒</span>
            <strong>{{ revenueOverview.renewalReminders.length }}</strong>
            <small>{{ revenueOverview.renewalReminders[0]?.title ?? "暂无续费提醒" }}</small>
          </article>
        </div>
      </section>

      <section class="page-card">
        <div class="drawer-head">
          <div>
            <h3>跟进记录</h3>
            <p>记录沟通内容，并为下一步动作生成提醒。</p>
          </div>
        </div>
        <el-timeline>
          <el-timeline-item v-for="item in followUps" :key="item.id" :timestamp="formatDateTime(item.createdAt)">
            <strong>{{ item.createdBy?.displayName }}</strong>
            <p>{{ item.content }}</p>
            <small v-if="item.reminder">提醒时间：{{ formatDateTime(item.reminder.remindAt) }}</small>
          </el-timeline-item>
        </el-timeline>
      </section>

      <section class="page-card">
        <h3>新增跟进</h3>
        <el-form
          :ref="setFormRef"
          :model="form"
          :rules="rules"
          label-position="top"
          require-asterisk-position="right"
          status-icon
          class="dialog-form"
        >
          <el-form-item label="跟进内容" prop="content" required>
            <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入本次跟进内容" />
          </el-form-item>
          <el-form-item label="下次跟进时间" prop="nextFollowUpAt">
            <el-date-picker
              v-model="form.nextFollowUpAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
              class="full-width"
            />
          </el-form-item>
          <el-button type="primary" @click="$emit('submit-follow-up')">保存跟进</el-button>
        </el-form>
      </section>

      <section v-if="customer" class="page-card">
        <RecordUploadPanel :attachments="attachments" @upload="$emit('upload', $event)" />
      </section>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadRequestOptions } from "element-plus";
import { computed } from "vue";

import RecordUploadPanel from "@/components/RecordUploadPanel.vue";
import type { Customer } from "@/types/customers";
import type { FollowUp, FollowUpFormModel } from "@/types/follow-ups";
import type { CustomerRevenueOverview } from "@/types/revenue-operations";
import type { Attachment } from "@/types/uploads";
import { formatDateTime } from "@/utils/display";

const props = defineProps<{
  visible: boolean;
  customer: Customer | null;
  revenueOverview: CustomerRevenueOverview | null;
  followUps: FollowUp[];
  form: FollowUpFormModel;
  rules: FormRules<FollowUpFormModel>;
  attachments: Attachment[];
  isTabletOrDown: boolean;
  setFormRef: (instance: FormInstance | undefined) => void;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "open-revenue": [];
  "submit-follow-up": [];
  upload: [options: UploadRequestOptions];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});
</script>

<style scoped>
.drawer-stack {
  display: grid;
  gap: 16px;
}

.drawer-head h3 {
  margin: 0 0 6px;
}

.drawer-head-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.drawer-head p {
  margin: 0;
  color: #64748b;
}

.revenue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.revenue-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.82);
}

.revenue-card span,
.revenue-card small {
  color: #64748b;
}

.revenue-card strong {
  font-size: 24px;
  line-height: 1;
}

.full-width {
  width: 100%;
}
</style>
