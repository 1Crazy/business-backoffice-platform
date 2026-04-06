<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" title="新增标签" width="460px" class="entity-dialog">
    <el-form
      :ref="setFormRef"
      :model="form"
      :rules="rules"
      label-position="top"
      require-asterisk-position="right"
      status-icon
      class="dialog-form"
    >
      <el-form-item label="标签名称" prop="name" required>
        <el-input v-model="form.name" placeholder="请输入标签名称" maxlength="16" />
      </el-form-item>
      <el-form-item label="颜色" prop="color">
        <el-input v-model="form.color" placeholder="#2563eb" />
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

import type { CustomerTagFormModel } from "@/types/customers";

const props = defineProps<{
  visible: boolean;
  form: CustomerTagFormModel;
  rules: FormRules<CustomerTagFormModel>;
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
