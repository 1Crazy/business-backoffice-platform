<template>
  <section class="policy-editor-section">
    <header class="policy-editor-header">
      <div>
        <strong>扩展数据范围</strong>
        <p>按团队、区域、客户池等维度补充角色可访问的数据集合。</p>
      </div>
      <el-button text @click="appendRule">新增规则</el-button>
    </header>
    <div v-if="form.extendedDataScopes.length === 0" class="policy-empty-state">
      未配置扩展范围时，系统只按基础数据范围与菜单权限生效。
    </div>
    <article v-for="(rule, index) in form.extendedDataScopes" :key="`extended-scope-${index}`" class="policy-rule-card">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="8">
          <el-form-item :label="`维度 ${index + 1}`">
            <el-select v-model="rule.dimension" placeholder="请选择维度">
              <el-option
                v-for="item in policyDimensionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="10">
          <el-form-item label="范围值">
            <el-input
              :model-value="stringifyRuleValues(rule.values)"
              placeholder="多个值使用逗号分隔，例如 华东一区, 华南二区"
              @update:model-value="updateRuleValues(index, $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-form-item label="备注">
            <el-input v-model="rule.note" placeholder="选填" />
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
import { POLICY_DIMENSION_OPTIONS } from "@/pages/platform-governance/policy-helpers";
import {
  createExtendedDataScopeRule,
  parseRuleValues,
  stringifyRuleValues
} from "@/pages/platform-governance/role-dialog-helpers";
import type { RoleFormModel } from "@/types/access-control";

const policyDimensionOptions = POLICY_DIMENSION_OPTIONS;

const props = defineProps<{
  form: RoleFormModel;
}>();

function appendRule(): void {
  props.form.extendedDataScopes.push(createExtendedDataScopeRule());
}

function removeRule(index: number): void {
  props.form.extendedDataScopes.splice(index, 1);
}

function updateRuleValues(index: number, value: string): void {
  const targetRule = props.form.extendedDataScopes[index];

  if (!targetRule) {
    return;
  }

  targetRule.values = parseRuleValues(value);
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
