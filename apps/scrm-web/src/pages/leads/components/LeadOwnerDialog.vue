<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" title="分配线索" width="460px" class="entity-dialog" append-to-body>
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
      <el-button type="primary" @click="$emit('submit')">确认分配</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { computed } from "vue";

import type { User } from "@/types/access-control";
import type { LeadOwnerFormModel } from "@/types/leads";

const props = defineProps<{
  visible: boolean;
  form: LeadOwnerFormModel;
  rules: FormRules<LeadOwnerFormModel>;
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
