<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <div>
    <div class="toolbar-row">
      <p>统一维护平台治理、OA 与 SCRM 共享的组织架构骨架。</p>
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
import type { Department } from "@/types/access-control";
import { formatAccessStatus } from "@/utils/display";

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
  color: var(--app-text-secondary);
}

@media (max-width: 960px) {
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
