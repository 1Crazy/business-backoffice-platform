<template>
  <section class="page-card filter-card">
    <el-form class="filter-form" label-position="top">
      <el-form-item label="关键词">
        <el-input v-model="filters.keyword" placeholder="线索名 / 联系人 / 手机" clearable />
      </el-form-item>
      <el-form-item label="来源">
        <el-select v-model="filters.source" clearable placeholder="全部来源">
          <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option v-for="item in leadStatuses" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="归属人">
        <el-select v-model="filters.ownerId" clearable placeholder="全部归属人">
          <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="排序">
        <el-select v-model="localSortPreset" placeholder="选择排序方式">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="toolbar-row">
      <p>线索页把“分配、转化、跟进、提醒”压缩到一条工作路径里，减少销售切换页面的次数。</p>
      <div class="toolbar-actions">
        <el-button @click="$emit('refresh')">刷新</el-button>
        <el-button type="primary" @click="$emit('create-lead')">新增线索</el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { User } from "@/types/access-control";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { Lead, LeadFilters } from "@/types/leads";

const props = defineProps<{
  filters: LeadFilters;
  sourceOptions: DictionaryEntry[];
  users: User[];
  leadStatuses: Lead["status"][];
  sortPreset: string;
  sortOptions: ReadonlyArray<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  refresh: [];
  "create-lead": [];
  "update:sortPreset": [value: string];
}>();

const localSortPreset = computed({
  get: () => props.sortPreset,
  set: (value: string) => emit("update:sortPreset", value)
});
</script>

<style scoped>
.filter-card {
  display: grid;
  gap: 16px;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
}

.filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 14px;
}

.filter-form :deep(.el-form-item__content),
.filter-form :deep(.el-input),
.filter-form :deep(.el-select) {
  width: 100%;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-row p {
  margin: 0;
  color: #64748b;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .filter-form {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: stretch;
  }

  .toolbar-actions :deep(.el-button) {
    flex: 1 1 140px;
  }
}
</style>
