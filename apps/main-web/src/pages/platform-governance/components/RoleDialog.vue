<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑角色' : '新增角色'"
    width="720px"
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
      <el-form-item label="数据范围" prop="dataScope" required>
        <el-select v-model="form.dataScope" placeholder="请选择数据范围">
          <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <RoleExtendedScopeEditor :form="form" />
      <RoleFieldRuleEditor :form="form" />
      <RoleActionRuleEditor :form="form" />
      <RolePolicyPreview :preview="policyPreview" />
      <RolePermissionCatalog :form="form" :permission-catalog="permissionCatalog" />
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

import {
  buildRolePolicyPreview,
  DATA_SCOPE_OPTIONS
} from "@/pages/platform-governance/policy-helpers";
import RoleActionRuleEditor from "@/pages/platform-governance/components/RoleActionRuleEditor.vue";
import RoleExtendedScopeEditor from "@/pages/platform-governance/components/RoleExtendedScopeEditor.vue";
import RoleFieldRuleEditor from "@/pages/platform-governance/components/RoleFieldRuleEditor.vue";
import RolePermissionCatalog from "@/pages/platform-governance/components/RolePermissionCatalog.vue";
import RolePolicyPreview from "@/pages/platform-governance/components/RolePolicyPreview.vue";
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

const dataScopeOptions = DATA_SCOPE_OPTIONS;

const policyPreview = computed(() =>
  buildRolePolicyPreview({
    dataScope: props.form.dataScope,
    permissionIds: props.form.permissionIds,
    permissionCatalog: props.permissionCatalog,
    extendedDataScopes: props.form.extendedDataScopes,
    fieldPermissionRules: props.form.fieldPermissionRules,
    actionPermissionRules: props.form.actionPermissionRules
  })
);
</script>

<style scoped>
</style>
