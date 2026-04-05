<template>
  <el-dialog v-model="dialogVisible" title="转交客户" width="460px" class="entity-dialog">
    <el-form
      :ref="setFormRef"
      :model="form"
      :rules="rules"
      label-position="top"
      require-asterisk-position="right"
      status-icon
      class="dialog-form"
    >
      <el-form-item label="新归属人" prop="ownerId" required>
        <el-select v-model="form.ownerId" class="full-width" placeholder="请选择新的归属人">
          <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="$emit('submit')">确认转交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { computed } from "vue";

import type { User } from "@/types/access-control";
import type { CustomerOwnerFormModel } from "@/types/customers";

const props = defineProps<{
  visible: boolean;
  form: CustomerOwnerFormModel;
  rules: FormRules<CustomerOwnerFormModel>;
  users: User[];
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
