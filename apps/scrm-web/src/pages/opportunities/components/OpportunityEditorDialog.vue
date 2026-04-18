<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑商机' : '新建商机'"
    width="720px"
    class="entity-dialog"
    append-to-body
  >
    <el-form
      :ref="setFormRef"
      :model="form"
      :rules="rules"
      label-position="top"
      require-asterisk-position="right"
      status-icon
      class="dialog-form"
    >
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="商机名称" prop="name" required>
            <el-input v-model="form.name" placeholder="例如：Acme 年度框架合作" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="关联客户" prop="customerId" required>
            <el-select v-model="form.customerId" placeholder="请选择客户" filterable>
              <el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="来源线索">
            <el-select v-model="form.sourceLeadId" placeholder="选填，可关联来源线索" filterable clearable>
              <el-option v-for="item in leads" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="归属人" prop="ownerId" required>
            <el-select v-model="form.ownerId" placeholder="请选择归属人" filterable>
              <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-form-item v-if="!form.id" label="初始阶段">
            <el-select v-model="form.stage" placeholder="请选择阶段">
              <el-option v-for="item in stageOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="当前阶段">
            <el-input :model-value="stageOptions.find((item) => item.value === form.stage)?.label ?? form.stage" disabled />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="预计金额" prop="expectedAmount" required>
            <el-input-number
              v-model="form.expectedAmount"
              :min="0"
              :precision="2"
              :step="1000"
              controls-position="right"
              class="full-width"
              placeholder="请输入预计金额"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="预计成交时间" prop="expectedCloseDate" required>
            <el-date-picker
              v-model="form.expectedCloseDate"
              type="datetime"
              placeholder="请选择时间"
              value-format="YYYY-MM-DDTHH:mm:ssZ"
              class="full-width"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="下一步动作" prop="nextAction" required>
        <el-input v-model="form.nextAction" placeholder="例如：本周完成方案评审并约客户确认预算" maxlength="120" />
      </el-form-item>

      <el-form-item label="补充说明">
        <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="可选，记录关键背景、决策链或风险点" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="$emit('submit')">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { computed } from "vue";

import type { User } from "@/types/access-control";
import type { OpportunityFormModel, OpportunityStage } from "@/types/opportunities";

const props = defineProps<{
  visible: boolean;
  form: OpportunityFormModel;
  rules: FormRules<OpportunityFormModel>;
  users: User[];
  customers: Array<{ id: string; name: string }>;
  leads: Array<{ id: string; name: string }>;
  stageOptions: Array<{ value: OpportunityStage; label: string }>;
  setFormRef: (instance: FormInstance | undefined) => void;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
