<template>
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑角色' : '新增角色'" width="720px" class="entity-dialog">
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
          <el-form-item label="角色名称" prop="name" required>
            <el-input v-model="form.name" placeholder="请输入角色名称" maxlength="24" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="编码" prop="code" required>
            <el-input
              v-model="form.code"
              :disabled="Boolean(form.id)"
              placeholder="请输入唯一编码，例如 sales-manager"
              maxlength="32"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="选填，描述该角色的职责边界" />
      </el-form-item>
      <el-form-item label="权限" prop="permissionIds" required>
        <el-checkbox-group v-model="form.permissionIds" class="permission-grid">
          <el-checkbox v-for="item in permissionCatalog" :key="item.id" :value="item.id">
            {{ item.name }}
          </el-checkbox>
        </el-checkbox-group>
        <div class="field-hint">未勾选任何权限的角色无法访问后台页面，绑定后只会进入无权限说明页。</div>
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

import type { PermissionItem, RoleFormModel } from "@/types/access-control";

const props = defineProps<{
  visible: boolean;
  form: RoleFormModel;
  rules: FormRules<RoleFormModel>;
  permissionCatalog: PermissionItem[];
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
.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.field-hint {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}
</style>
