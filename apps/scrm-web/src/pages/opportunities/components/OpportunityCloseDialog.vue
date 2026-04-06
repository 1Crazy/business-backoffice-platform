<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" :title="mode === 'WON' ? '赢单收口' : '输单收口'" width="480px">
    <el-form :ref="setFormRef" :model="form" :rules="rules" label-position="top" status-icon>
      <el-alert
        v-if="opportunity"
        :type="mode === 'WON' ? 'success' : 'warning'"
        show-icon
        :closable="false"
        class="summary-alert"
        :title="`当前商机：${opportunity.name}`"
        :description="mode === 'WON' ? '赢单会记录收口时间并保留当前阶段轨迹。' : '输单会要求记录原因，方便后续复盘。'"
      />

      <el-form-item v-if="mode === 'LOST'" label="输单原因" prop="lostReason" required>
        <el-input v-model="form.lostReason" type="textarea" :rows="3" placeholder="请输入本次输单的核心原因" />
      </el-form-item>

      <el-form-item label="补充备注">
        <el-input v-model="form.comment" type="textarea" :rows="3" placeholder="可选，补充关键上下文或下一步安排" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button :type="mode === 'WON' ? 'success' : 'danger'" @click="$emit('submit')">
        {{ mode === 'WON' ? '确认赢单' : '确认输单' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { computed } from "vue";

import type { Opportunity, OpportunityCloseFormModel } from "@/types/opportunities";

const props = defineProps<{
  visible: boolean;
  mode: "WON" | "LOST";
  opportunity: Opportunity | null;
  form: OpportunityCloseFormModel;
  rules: FormRules<OpportunityCloseFormModel>;
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
