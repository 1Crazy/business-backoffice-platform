<template>
  <section class="policy-editor-section">
    <header class="policy-editor-header">
      <div>
        <strong>动作级限制</strong>
        <p>为审批、导出、收口或回款确认等关键动作补充允许或禁止规则。</p>
      </div>
      <el-button text @click="appendRule">新增规则</el-button>
    </header>
    <div v-if="form.actionPermissionRules.length === 0" class="policy-empty-state">
      未配置动作限制时，仅沿用当前权限点映射出的页面与操作能力。
    </div>
    <article v-for="(rule, index) in form.actionPermissionRules" :key="`action-rule-${index}`" class="policy-rule-card">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="8">
          <el-form-item :label="`业务资源 ${index + 1}`">
            <el-input v-model="rule.resource" placeholder="例如 审批（approval）或营收（revenue）" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="动作编码">
            <el-input v-model="rule.action" placeholder="例如 导出（export）或确认回款（confirm-payment）" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="授权结果">
            <el-select v-model="rule.allowed" placeholder="请选择授权结果">
              <el-option label="允许" :value="true" />
              <el-option label="禁止" :value="false" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <div class="policy-rule-actions">
        <el-button text @click="removeRule(index)">删除</el-button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { createActionPermissionRule } from "@/pages/platform-governance/role-dialog-helpers";
import type { RoleFormModel } from "@/types/access-control";

const props = defineProps<{
  form: RoleFormModel;
}>();

function appendRule(): void {
  props.form.actionPermissionRules.push(createActionPermissionRule());
}

function removeRule(index: number): void {
  props.form.actionPermissionRules.splice(index, 1);
}
</script>

<style scoped>
.policy-editor-section {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.policy-editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.policy-editor-header strong {
  color: #0f172a;
}

.policy-editor-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.policy-empty-state {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
}

.policy-rule-card {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.policy-rule-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .policy-editor-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
