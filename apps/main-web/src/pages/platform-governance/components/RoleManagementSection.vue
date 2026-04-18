<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <div>
    <div class="toolbar-row">
      <p>维护角色与组合策略。</p>
      <el-button type="primary" @click="$emit('create')">新增角色</el-button>
    </div>

    <section class="policy-summary-grid">
      <article class="policy-summary-card">
        <span>全部数据</span>
        <strong>{{ roles.filter((item) => item.dataScope === "ALL").length }}</strong>
      </article>
      <article class="policy-summary-card">
        <span>部门范围</span>
        <strong>{{ roles.filter((item) => item.dataScope === "DEPARTMENT" || item.dataScope === "DEPARTMENT_AND_SUBTREE").length }}</strong>
      </article>
      <article class="policy-summary-card">
        <span>仅本人</span>
        <strong>{{ roles.filter((item) => item.dataScope === "SELF" || !item.dataScope).length }}</strong>
      </article>
      <article class="policy-summary-card">
        <span>细粒度策略</span>
        <strong>{{ roles.filter((item) => hasGranularPolicies(item)).length }}</strong>
      </article>
    </section>

    <div class="page-table-shell">
      <el-table :data="roles" border>
        <el-table-column prop="name" label="角色名称" min-width="160" />
        <el-table-column prop="code" label="编码" min-width="140" />
        <el-table-column label="数据范围" min-width="150">
          <template #default="{ row }">
            {{ formatDataScope(row.dataScope) }}
          </template>
        </el-table-column>
        <el-table-column label="组合策略" min-width="260">
          <template #default="{ row }">
            <div class="policy-chip-list">
              <el-tag v-for="item in getPolicyPreview(row).domainLabels" :key="`${row.id}-${item}`" class="tag-item" type="info">
                {{ item }}
              </el-tag>
              <el-tag
                v-for="item in getPolicyPreview(row).extendedScopeLabels.slice(0, 2)"
                :key="`${row.id}-${item}`"
                class="tag-item"
                type="success"
              >
                {{ item }}
              </el-tag>
              <el-tag v-for="item in getPolicyPreview(row).actionLabels" :key="`${row.id}-${item}`" class="tag-item">
                {{ item }}
              </el-tag>
              <el-tag v-if="getPolicyPreview(row).fieldRuleCount > 0" class="tag-item" type="warning">
                字段规则 {{ getPolicyPreview(row).fieldRuleCount }}
              </el-tag>
              <el-tag v-if="getPolicyPreview(row).actionRuleCount > 0" class="tag-item" type="danger">
                动作限制 {{ getPolicyPreview(row).actionRuleCount }}
              </el-tag>
              <el-tag v-if="row.permissions.length === 0" class="tag-item" type="warning">未分配权限</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            {{ formatAccessStatus(row.status) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button text @click="$emit('edit', row)">编辑</el-button>
            <el-button text @click="$emit('toggle', row)">{{ row.status === "ACTIVE" ? "停用" : "启用" }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildRolePolicyPreview } from "@/pages/platform-governance/policy-helpers";
import type { Role } from "@/types/access-control";
import { formatAccessStatus, formatDataScope } from "@/utils/display";

defineProps<{
  roles: Role[];
}>();

defineEmits<{
  create: [];
  edit: [role: Role];
  toggle: [role: Role];
}>();

function getPolicyPreview(role: Role) {
  return buildRolePolicyPreview({
    dataScope: role.dataScope,
    permissionIds: role.permissions.map((item) => item.permission.id),
    permissionCatalog: role.permissions.map((item) => item.permission),
    extendedDataScopes: role.extendedDataScopes,
    fieldPermissionRules: role.fieldPermissionRules,
    actionPermissionRules: role.actionPermissionRules
  });
}

function hasGranularPolicies(role: Role): boolean {
  return role.extendedDataScopes.length > 0 || role.fieldPermissionRules.length > 0 || role.actionPermissionRules.length > 0;
}
</script>

<style scoped>
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar-row p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.policy-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.policy-summary-card {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(248, 250, 252, 0.9);
}

.policy-summary-card span {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.policy-summary-card strong {
  font-size: 28px;
  line-height: 1;
}

.policy-chip-list {
  display: flex;
  flex-wrap: wrap;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 6px;
}

@media (max-width: 960px) {
  .policy-summary-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
