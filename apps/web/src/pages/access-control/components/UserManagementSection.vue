<template>
  <div>
    <div class="toolbar-row">
      <p>员工账号与角色绑定后，会直接影响菜单可见性和接口授权范围。</p>
      <el-button type="primary" @click="$emit('create')">新增员工</el-button>
    </div>

    <div class="page-table-shell">
      <el-table :data="users" border>
        <el-table-column prop="username" label="账号" min-width="140" />
        <el-table-column prop="displayName" label="姓名" min-width="140" />
        <el-table-column label="部门" min-width="160">
          <template #default="{ row }">
            {{ row.department?.name ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="220">
          <template #default="{ row }">
            <el-tag v-for="item in row.roles" :key="item.role.id" class="tag-item">
              {{ item.role.name }}
            </el-tag>
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
import type { User } from "@/types/access-control";

defineProps<{
  users: User[];
}>();

defineEmits<{
  create: [];
  edit: [user: User];
  toggle: [user: User];
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
