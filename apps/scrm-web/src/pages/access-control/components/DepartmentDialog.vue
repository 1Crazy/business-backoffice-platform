<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑部门' : '新增部门'"
    width="520px"
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
      <el-form-item label="部门名称" prop="name" required>
        <el-input v-model="form.name" placeholder="请输入部门名称" maxlength="24" />
      </el-form-item>
      <el-form-item label="编码" prop="code" required>
        <el-input v-model="form.code" placeholder="请输入唯一编码，例如 华东销售部（SALES-NORTH）" maxlength="32" />
      </el-form-item>
      <el-form-item label="上级部门" prop="parentId">
        <el-select v-model="form.parentId" clearable class="full-width" placeholder="不选则创建一级部门">
          <el-option
            v-for="item in departments.filter((department) => department.id !== form.id)"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
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

import type { Department, DepartmentFormModel } from "@/types/access-control";

const props = defineProps<{
  visible: boolean;
  form: DepartmentFormModel;
  rules: FormRules<DepartmentFormModel>;
  departments: Department[];
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
