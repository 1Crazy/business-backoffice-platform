<template>
  <el-form-item label="权限" prop="permissionIds" required>
    <div class="permission-app-list">
      <section v-for="appSection in permissionSections" :key="appSection.appCode" class="permission-app-section">
        <header class="permission-app-header">
          <div class="permission-app-title">{{ appSection.label }}</div>
          <div class="permission-app-caption">按业务分组勾选当前应用可访问的页面与动作。</div>
        </header>

        <div class="permission-group-list">
          <section
            v-for="groupSection in appSection.groups"
            :key="`${appSection.appCode}-${groupSection.group}`"
            class="permission-group-section"
          >
            <div class="permission-group-title">{{ groupSection.label }}</div>
            <el-checkbox-group v-model="form.permissionIds" class="permission-grid">
              <el-checkbox v-for="item in groupSection.items" :key="item.id" :value="item.id">
                {{ item.name }}
              </el-checkbox>
            </el-checkbox-group>
          </section>
        </div>
      </section>
    </div>
    <div class="field-hint">未勾选任何权限的角色无法访问后台页面，绑定后只会进入无权限说明页。</div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { buildPermissionSections } from "@/pages/platform-governance/role-dialog-helpers";
import type { PermissionItem, RoleFormModel } from "@/types/access-control";

const props = defineProps<{
  form: RoleFormModel;
  permissionCatalog: PermissionItem[];
}>();

const permissionSections = computed(() => buildPermissionSections(props.permissionCatalog));
</script>

<style scoped>
.permission-app-list {
  display: grid;
  gap: 16px;
}

.permission-app-section {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.permission-app-header {
  margin-bottom: 14px;
}

.permission-app-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.permission-app-caption {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.permission-group-list {
  display: grid;
  gap: 14px;
}

.permission-group-section {
  display: grid;
  gap: 10px;
}

.permission-group-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

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
