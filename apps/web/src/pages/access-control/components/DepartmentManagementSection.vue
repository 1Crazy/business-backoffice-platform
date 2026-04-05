<template>
  <div>
    <div class="toolbar-row">
      <p>支持建立部门层级，为主管看板和数据权限预留团队视角。</p>
      <el-button type="primary" @click="$emit('create')">新增部门</el-button>
    </div>

    <div class="page-table-shell">
      <el-table :data="departments" border>
        <el-table-column prop="name" label="部门名称" min-width="160" />
        <el-table-column prop="code" label="编码" min-width="120" />
        <el-table-column label="上级部门" min-width="160">
          <template #default="{ row }">
            {{ row.parent?.name ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" />
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
import type { Department } from "@/types/access-control";

defineProps<{
  departments: Department[];
}>();

defineEmits<{
  create: [];
  edit: [department: Department];
  toggle: [department: Department];
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
  color: #64748b;
}

@media (max-width: 960px) {
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
