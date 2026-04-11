<!-- 平台治理页面：以原生主应用页面承接组织、员工与角色治理，同时保持长期平台语义。 -->
<template>
  <div class="page-grid">
    <section class="page-card intro-card">
      <div class="intro-copy">
        <span class="page-kicker">平台治理</span>
        <div>
          <div class="breadcrumb-text">平台治理 / {{ tabMeta.label }}</div>
          <h2 class="page-title">{{ tabMeta.title }}</h2>
        </div>
        <p class="page-description">{{ tabMeta.description }}</p>
      </div>

      <el-tabs :model-value="activeTab" class="platform-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="部门治理" name="departments" />
        <el-tab-pane label="员工治理" name="employees" />
        <el-tab-pane label="角色授权" name="roles" />
      </el-tabs>
    </section>

    <AccessControlSummarySection :departments="departments" :loading="isLoading" :users="users" :roles="roles" />

    <section class="page-card">
      <DepartmentManagementSection
        v-if="activeTab === 'departments'"
        :departments="departments"
        @create="openDepartmentDialog"
        @edit="openDepartmentDialog"
        @toggle="toggleDepartment"
      />

      <UserManagementSection
        v-else-if="activeTab === 'employees'"
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
import { useRoute, useRouter } from "vue-router";

import { useAccessControlPage } from "@/composables/access-control/useAccessControlPage";
import AccessControlSummarySection from "@/pages/platform-governance/components/AccessControlSummarySection.vue";
import DepartmentDialog from "@/pages/platform-governance/components/DepartmentDialog.vue";
import DepartmentManagementSection from "@/pages/platform-governance/components/DepartmentManagementSection.vue";
import RoleDialog from "@/pages/platform-governance/components/RoleDialog.vue";
import RoleManagementSection from "@/pages/platform-governance/components/RoleManagementSection.vue";
import UserDialog from "@/pages/platform-governance/components/UserDialog.vue";
import UserManagementSection from "@/pages/platform-governance/components/UserManagementSection.vue";

const route = useRoute();
const router = useRouter();
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

const tabRouteMap = {
  departments: "/platform/organization/departments",
  employees: "/platform/organization/employees",
  roles: "/platform/access/roles"
} as const;

const tabMetaMap = {
  departments: {
    label: "组织架构",
    title: "部门治理",
    description: "用统一组织骨架支撑平台治理、OA 与 SCRM 的部门关系、归属和后续团队视角。"
  },
  employees: {
    label: "员工账号",
    title: "员工治理",
    description: "在一个中性治理域里维护员工账号、部门归属与角色绑定，避免再把共享身份误解为业务域私有能力。"
  },
  roles: {
    label: "授权治理",
    title: "角色授权",
    description: "统一配置平台治理、OA 与 SCRM 的页面权限，让同一角色在多个后台域内保持清晰而一致的授权边界。"
  }
} as const;

const activeTab = computed<keyof typeof tabRouteMap>(() => {
  const currentTab = route.meta.governanceTab;

  if (currentTab === "employees" || currentTab === "roles") {
    return currentTab;
  }

  return "departments";
});
const tabMeta = computed(() => tabMetaMap[activeTab.value]);

function handleTabChange(name: string | number): void {
  if (typeof name !== "string" || !(name in tabRouteMap)) {
    return;
  }

  const nextPath = tabRouteMap[name as keyof typeof tabRouteMap];

  if (nextPath !== route.path) {
    void router.push(nextPath);
  }
}
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

.intro-card {
  display: grid;
  gap: 16px;
}

.intro-copy {
  display: grid;
  gap: 12px;
}

.breadcrumb-text {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.page-title {
  margin: 10px 0 0;
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.page-description {
  max-width: 760px;
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.platform-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.platform-tabs :deep(.el-tabs__nav-wrap::after) {
  background: rgba(73, 98, 118, 0.12);
}
</style>
