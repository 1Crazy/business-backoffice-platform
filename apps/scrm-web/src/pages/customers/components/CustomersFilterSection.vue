<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card filter-card">
    <div class="filter-toolbar">
      <div class="filter-actions">
        <span v-if="loading" class="loading-badge">筛选项同步中</span>
        <el-button @click="$emit('refresh')">刷新</el-button>
        <el-button @click="$emit('create-tag')">新建标签</el-button>
        <el-button type="primary" @click="$emit('create-customer')">新增客户</el-button>
      </div>
    </div>
    <el-form class="filter-form" label-position="top">
      <el-form-item label="关键词">
        <el-input v-model="filters.keyword" placeholder="客户名 / 联系人 / 手机" clearable />
      </el-form-item>
      <el-form-item label="来源">
        <el-select v-model="filters.source" clearable placeholder="全部来源">
          <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="归属人">
        <el-select v-model="filters.ownerId" clearable placeholder="全部归属人">
          <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="filters.tagId" clearable placeholder="全部标签">
          <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="排序">
        <el-select v-model="localSortPreset" placeholder="选择排序方式">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { User } from "@/types/access-control";
import type { CustomerFilters, CustomerTag } from "@/types/customers";
import type { DictionaryEntry } from "@/types/dictionaries";

const props = defineProps<{
  filters: CustomerFilters;
  loading?: boolean;
  sourceOptions: DictionaryEntry[];
  statusOptions: DictionaryEntry[];
  users: User[];
  tags: CustomerTag[];
  sortPreset: string;
  sortOptions: ReadonlyArray<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  refresh: [];
  "create-tag": [];
  "create-customer": [];
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
  gap: 14px;
}

.filter-toolbar {
  display: flex;
  justify-content: flex-end;
}

.filter-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 16px;
}

.filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 12px;
}

.filter-form :deep(.el-form-item__label) {
  min-height: 18px;
  line-height: 18px;
  margin-bottom: 6px;
}

.filter-form :deep(.el-form-item__content),
.filter-form :deep(.el-input),
.filter-form :deep(.el-select) {
  width: 100%;
}

@media (max-width: 960px) {
  .filter-form {
    grid-template-columns: 1fr 1fr;
  }

  .filter-toolbar {
    justify-content: stretch;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions :deep(.el-button) {
    flex: 1 1 140px;
  }
}

@media (max-width: 640px) {
  .filter-form {
    grid-template-columns: 1fr;
  }
}
</style>
