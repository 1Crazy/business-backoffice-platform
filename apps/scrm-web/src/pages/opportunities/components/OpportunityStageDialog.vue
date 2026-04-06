<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" title="推进商机阶段" width="480px">
    <el-form :ref="setFormRef" :model="form" :rules="rules" label-position="top" status-icon>
      <el-alert
        v-if="opportunity"
        type="info"
        show-icon
        :closable="false"
        class="summary-alert"
        :title="`当前商机：${opportunity.name}`"
        :description="`当前阶段：${formatOpportunityStage(opportunity.stage)}`"
      />

      <el-form-item label="目标阶段" prop="stage" required>
        <el-select v-model="form.stage" placeholder="请选择目标阶段">
          <el-option v-for="item in stageOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="推进备注">
        <el-input v-model="form.comment" type="textarea" :rows="3" placeholder="可选，记录这次推进背后的关键信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="$emit('submit')">确认推进</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { computed } from "vue";

import type { Opportunity, OpportunityStage, OpportunityStageFormModel } from "@/types/opportunities";
import { formatOpportunityStage } from "@/utils/display";

const props = defineProps<{
  visible: boolean;
  opportunity: Opportunity | null;
  form: OpportunityStageFormModel;
  rules: FormRules<OpportunityStageFormModel>;
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
.summary-alert {
  margin-bottom: 16px;
}
</style>
