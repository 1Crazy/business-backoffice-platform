<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" title="重新分配商机" width="420px" append-to-body>
    <el-form :ref="setFormRef" :model="form" :rules="rules" label-position="top" status-icon>
      <el-form-item label="新的归属人" prop="ownerId" required>
        <el-select v-model="form.ownerId" placeholder="请选择归属人" filterable>
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
import type { OpportunityOwnerFormModel } from "@/types/opportunities";

const props = defineProps<{
  visible: boolean;
  form: OpportunityOwnerFormModel;
  rules: FormRules<OpportunityOwnerFormModel>;
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
