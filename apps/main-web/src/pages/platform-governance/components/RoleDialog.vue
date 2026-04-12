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
      <el-form-item label="权限" prop="permissionIds" required>
        <div class="permission-app-list">
          <section v-for="appSection in permissionSections" :key="appSection.appCode" class="permission-app-section">
            <header class="permission-app-header">
              <div class="permission-app-title">{{ appSection.label }}</div>
              <div class="permission-app-caption">按业务分组勾选当前应用可访问的页面与动作。</div>
            </header>

            <div class="permission-group-list">
              <section v-for="groupSection in appSection.groups" :key="`${appSection.appCode}-${groupSection.group}`" class="permission-group-section">
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

const APP_LABELS: Record<string, string> = {
  platform: "平台治理",
  oa: "OA 办公台",
  scrm: "SCRM 控制台"
};

const GROUP_LABELS: Record<string, string> = {
  access: "组织与授权",
  announcement: "公告通知",
  approval: "审批中心",
  customer: "客户中心",
  dashboard: "运营看板",
  directory: "组织通讯录",
  leave: "请假申请",
  lead: "线索中心",
  opportunity: "商机管理",
  request: "行政申请",
  system: "系统管理",
  workspace: "工作台"
};

const permissionSections = computed(() => {
  const sections = new Map<
    string,
    {
      appCode: string;
      label: string;
      groups: Map<
        string,
        {
          group: string;
          label: string;
          items: PermissionItem[];
        }
      >;
    }
  >();

  for (const item of props.permissionCatalog) {
    const appSection =
      sections.get(item.appCode) ??
      {
        appCode: item.appCode,
        label: APP_LABELS[item.appCode] ?? item.appCode.toUpperCase(),
        groups: new Map()
      };

    const groupSection =
      appSection.groups.get(item.group) ??
      {
        group: item.group,
        label: GROUP_LABELS[item.group] ?? item.group,
        items: []
      };

    groupSection.items.push(item);
    appSection.groups.set(item.group, groupSection);
    sections.set(item.appCode, appSection);
  }

  return Array.from(sections.values()).map((appSection) => ({
    appCode: appSection.appCode,
    label: appSection.label,
    groups: Array.from(appSection.groups.values())
  }));
});
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
