<template>
  <section>
    <div class="toolbar-row">
      <p>客户来源、客户状态等字段通过字典驱动，避免业务表单硬编码。</p>
      <el-button type="primary" @click="$emit('create')">新增字典项</el-button>
    </div>

    <div class="page-table-shell">
      <el-table :data="dictionaryEntries" border>
        <el-table-column prop="type" label="类型" min-width="160" />
        <el-table-column prop="label" label="标签" min-width="160" />
        <el-table-column prop="value" label="值" min-width="160" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            {{ row.enabled ? "启用" : "停用" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button text @click="$emit('edit', row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DictionaryEntry } from "@/types/dictionaries";

defineProps<{
  dictionaryEntries: DictionaryEntry[];
}>();

defineEmits<{
  create: [];
  edit: [entry: DictionaryEntry];
}>();
</script>

<style scoped>
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
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
