<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <div>
    <div class="toolbar-row">
      <p>维护角色权限。</p>
      <el-button type="primary" @click="$emit('create')">新增角色</el-button>
    </div>

    <div class="page-table-shell">
      <el-table :data="roles" border>
        <el-table-column prop="name" label="角色名称" min-width="160" />
        <el-table-column prop="code" label="编码" min-width="140" />
        <el-table-column label="权限" min-width="260">
          <template #default="{ row }">
            <el-tag v-if="row.permissions.length === 0" class="tag-item" type="warning">未分配权限</el-tag>
            <el-tag v-for="item in row.permissions" :key="item.permission.id" class="tag-item" type="info">
              {{ item.permission.name }}
            </el-tag>
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
import type { Role } from "@/types/access-control";
import { formatAccessStatus } from "@/utils/display";

defineProps<{
  roles: Role[];
}>();

defineEmits<{
  create: [];
  edit: [role: Role];
  toggle: [role: Role];
}>();
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
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 6px;
}

@media (max-width: 960px) {
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
