<!-- access-control 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="page-grid">
    <AccessControlSummarySection :departments="departments" :loading="isLoading" :users="users" :roles="roles" />

    <section class="page-card">
      <template v-if="isLoading">
        <div class="access-skeleton">
          <div class="access-tabs-skeleton">
            <span class="ui-skeleton ui-skeleton-pill" />
            <span class="ui-skeleton ui-skeleton-pill" />
            <span class="ui-skeleton ui-skeleton-pill" />
          </div>
          <div v-for="item in 4" :key="item" class="access-row-skeleton">
            <span class="ui-skeleton ui-skeleton-line medium" />
            <span class="ui-skeleton ui-skeleton-line short" />
            <span class="ui-skeleton ui-skeleton-line long" />
          </div>
        </div>
      </template>
      <template v-else>
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
      </template>
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
  isLoading,
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

.access-skeleton {
  display: grid;
  gap: 12px;
}

.access-tabs-skeleton {
  display: flex;
  gap: 10px;
}

.access-row-skeleton {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.62);
}

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}
</style>
