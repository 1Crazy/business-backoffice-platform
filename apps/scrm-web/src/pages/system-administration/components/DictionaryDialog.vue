<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑字典项' : '新增字典项'"
    width="560px"
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
          <el-form-item label="类型" prop="type" required>
            <el-input v-model="form.type" placeholder="请输入类型，例如 customer-source" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="标签" prop="label" required>
            <el-input v-model="form.label" placeholder="请输入展示标签" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="值" prop="value" required>
            <el-input v-model="form.value" placeholder="请输入字典值" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" class="full-width" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="是否启用" prop="enabled">
        <el-switch v-model="form.enabled" />
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

import type { DictionaryFormModel } from "@/types/system-administration";

const props = defineProps<{
  visible: boolean;
  form: DictionaryFormModel;
  rules: FormRules<DictionaryFormModel>;
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
