<!-- 平台治理页面：以原生主应用页面承接组织、员工与角色治理，同时保持长期平台语义。 -->
<template>
  <div class="page-grid">
    <AccessControlSummarySection :departments="departments" :loading="isLoading" :users="users" :roles="roles" />

    <section class="page-card">
      <DepartmentManagementSection
        v-if="currentTab === 'departments'"
        :departments="departments"
        @create="openDepartmentDialog"
        @edit="openDepartmentDialog"
        @toggle="toggleDepartment"
      />

      <UserManagementSection
        v-else-if="currentTab === 'employees'"
        :users="users"
        @create="openUserDialog"
        @edit="openUserDialog"
        @toggle="toggleUser"
      />

      <RoleManagementSection
        v-else
        :roles="roles"
        @create="openRoleDialog"
        @edit="openRoleDialog"
        @toggle="toggleRole"
      />
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
import { computed } from "vue";
import { useRoute } from "vue-router";

import { useAccessControlPage } from "@/composables/access-control/useAccessControlPage";
import AccessControlSummarySection from "@/pages/platform-governance/components/AccessControlSummarySection.vue";
import DepartmentDialog from "@/pages/platform-governance/components/DepartmentDialog.vue";
import DepartmentManagementSection from "@/pages/platform-governance/components/DepartmentManagementSection.vue";
import RoleDialog from "@/pages/platform-governance/components/RoleDialog.vue";
import RoleManagementSection from "@/pages/platform-governance/components/RoleManagementSection.vue";
import UserDialog from "@/pages/platform-governance/components/UserDialog.vue";
import UserManagementSection from "@/pages/platform-governance/components/UserManagementSection.vue";

const route = useRoute();
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

const currentTab = computed<"departments" | "employees" | "roles">(() => {
  const currentTab = route.meta.governanceTab;

  if (currentTab === "employees" || currentTab === "roles") {
    return currentTab;
  }

  return "departments";
});
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 16px;
}
</style>
