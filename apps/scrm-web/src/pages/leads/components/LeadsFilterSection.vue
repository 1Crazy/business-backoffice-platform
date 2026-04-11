<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
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
          <el-option v-for="item in leadStatuses" :key="item" :label="formatLeadStatus(item)" :value="item" />
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
      <p>按归属、状态和来源筛选。</p>
      <div class="toolbar-actions">
        <span v-if="loading" class="loading-badge">筛选项同步中</span>
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
import { formatLeadStatus } from "@/utils/display";

const props = defineProps<{
  filters: LeadFilters;
  loading?: boolean;
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
  color: var(--app-text-secondary);
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
