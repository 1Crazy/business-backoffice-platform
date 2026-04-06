<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑员工' : '新增员工'" width="640px" class="entity-dialog">
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
          <el-form-item label="账号" prop="username" required>
            <el-input v-model="form.username" :disabled="Boolean(form.id)" placeholder="请输入登录账号" maxlength="24" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="姓名" prop="displayName" required>
            <el-input v-model="form.displayName" placeholder="请输入员工姓名" maxlength="24" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="密码" prop="password" :required="!form.id">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              :placeholder="form.id ? '留空则保持原密码' : '请输入至少 8 位密码'"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="部门" prop="departmentId" required>
            <el-select v-model="form.departmentId" clearable class="full-width" placeholder="请选择所属部门">
              <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="选填，示例：ops@example.com" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="选填，便于后续联系" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="角色" prop="roleIds" required>
        <el-select v-model="form.roleIds" class="full-width" multiple placeholder="请至少选择一个角色">
          <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <div class="field-hint">至少一个角色需要具备页面权限，否则账号登录后只能进入无权限说明页。</div>
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

import type { Department, Role, UserFormModel } from "@/types/access-control";

const props = defineProps<{
  visible: boolean;
  form: UserFormModel;
  rules: FormRules<UserFormModel>;
  departments: Department[];
  roles: Role[];
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

.field-hint {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}
</style>
