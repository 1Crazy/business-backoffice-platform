<!-- access-control 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="page-grid">
    <AccessControlSummarySection :departments="departments" :users="users" :roles="roles" />

    <section class="page-card">
      <el-tabs>
        <el-tab-pane label="部门管理">
          <DepartmentManagementSection
            :departments="departments"
            @create="openDepartmentDialog"
            @edit="openDepartmentDialog"
            @toggle="toggleDepartment"
          />
        </el-tab-pane>

        <el-tab-pane label="员工管理">
          <UserManagementSection
            :users="users"
            @create="openUserDialog"
            @edit="openUserDialog"
            @toggle="toggleUser"
          />
        </el-tab-pane>

        <el-tab-pane label="角色权限">
          <RoleManagementSection
            :roles="roles"
            @create="openRoleDialog"
            @edit="openRoleDialog"
            @toggle="toggleRole"
          />
        </el-tab-pane>
      </el-tabs>
    </section>

    <DepartmentDialog
      v-model:visible="departmentDialogVisible"
      :form="departmentForm"
      :rules="departmentRules"
      :departments="departments"
      :set-form-ref="setDepartmentFormRef"
      @submit="submitDepartment"
    />

    <UserDialog
      v-model:visible="userDialogVisible"
      :form="userForm"
      :rules="userRules"
      :departments="departments"
      :roles="roles"
      :set-form-ref="setUserFormRef"
      @submit="submitUser"
    />

    <RoleDialog
      v-model:visible="roleDialogVisible"
      :form="roleForm"
      :rules="roleRules"
      :permission-catalog="permissionCatalog"
      :set-form-ref="setRoleFormRef"
      @submit="submitRole"
    />
  </div>
</template>

<script setup lang="ts">
import AccessControlSummarySection from "@/pages/access-control/components/AccessControlSummarySection.vue";
import DepartmentDialog from "@/pages/access-control/components/DepartmentDialog.vue";
import DepartmentManagementSection from "@/pages/access-control/components/DepartmentManagementSection.vue";
import RoleDialog from "@/pages/access-control/components/RoleDialog.vue";
import RoleManagementSection from "@/pages/access-control/components/RoleManagementSection.vue";
import UserDialog from "@/pages/access-control/components/UserDialog.vue";
import UserManagementSection from "@/pages/access-control/components/UserManagementSection.vue";
import { useAccessControlPage } from "@/composables/access-control/useAccessControlPage";

const {
  departmentDialogVisible,
  departmentForm,
  departmentRules,
  departments,
  openDepartmentDialog,
  openRoleDialog,
  openUserDialog,
  permissionCatalog,
  roleDialogVisible,
  roleForm,
  roleRules,
  roles,
  setDepartmentFormRef,
  setRoleFormRef,
  setUserFormRef,
  submitDepartment,
  submitRole,
  submitUser,
  toggleDepartment,
  toggleRole,
  toggleUser,
  userDialogVisible,
  userForm,
  userRules,
  users
} = useAccessControlPage();
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}
</style>
