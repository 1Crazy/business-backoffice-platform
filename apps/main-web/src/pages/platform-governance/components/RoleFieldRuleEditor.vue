<template>
  <section class="policy-editor-section">
    <header class="policy-editor-header">
      <div>
        <strong>字段级规则</strong>
        <p>用于限制敏感字段的展示方式和是否允许编辑。</p>
      </div>
      <el-button text @click="appendRule">新增规则</el-button>
    </header>
    <div v-if="form.fieldPermissionRules.length === 0" class="policy-empty-state">
      未配置字段规则时，前端页面不会额外提示字段脱敏或只读策略。
    </div>
    <article v-for="(rule, index) in form.fieldPermissionRules" :key="`field-rule-${index}`" class="policy-rule-card">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="8">
          <el-form-item :label="`业务资源 ${index + 1}`">
            <el-input v-model="rule.resource" placeholder="例如 客户（customer）或合同（contract）" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="字段编码">
            <el-input v-model="rule.field" placeholder="例如 手机号（mobile）或金额（amount）" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="控制级别">
            <el-select v-model="rule.visibility" placeholder="请选择控制级别">
              <el-option
                v-for="item in fieldVisibilityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
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
import { FIELD_VISIBILITY_OPTIONS } from "@/pages/platform-governance/policy-helpers";
import { createFieldPermissionRule } from "@/pages/platform-governance/role-dialog-helpers";
import type { RoleFormModel } from "@/types/access-control";

const props = defineProps<{
  form: RoleFormModel;
}>();

const fieldVisibilityOptions = FIELD_VISIBILITY_OPTIONS;

function appendRule(): void {
  props.form.fieldPermissionRules.push(createFieldPermissionRule());
}

function removeRule(index: number): void {
  props.form.fieldPermissionRules.splice(index, 1);
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
