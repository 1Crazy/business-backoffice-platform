<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑客户' : '新增客户'" width="760px" class="entity-dialog">
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
          <el-form-item label="客户名称" prop="name" required>
            <el-input v-model="form.name" placeholder="请输入客户名称" maxlength="36" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="联系人" prop="contactName">
            <el-input v-model="form.contactName" placeholder="选填，便于后续跟进" maxlength="24" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="选填，支持后续搜索与去重" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="选填，示例：contact@example.com" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="来源" prop="source">
            <el-select v-model="form.source" clearable class="full-width" placeholder="请选择客户来源">
              <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" clearable class="full-width" placeholder="请选择客户状态">
              <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="归属人" prop="ownerId" required>
            <el-select v-model="form.ownerId" class="full-width" placeholder="请选择归属人">
              <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="标签" prop="tagIds">
            <el-select v-model="form.tagIds" multiple class="full-width" clearable placeholder="可多选标签">
              <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="notes">
        <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="选填，记录当前客户情况" />
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
import type { CustomerFormModel, CustomerTag } from "@/types/customers";
import type { DictionaryEntry } from "@/types/dictionaries";

const props = defineProps<{
  visible: boolean;
  form: CustomerFormModel;
  rules: FormRules<CustomerFormModel>;
  users: User[];
  tags: CustomerTag[];
  sourceOptions: DictionaryEntry[];
  statusOptions: DictionaryEntry[];
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
