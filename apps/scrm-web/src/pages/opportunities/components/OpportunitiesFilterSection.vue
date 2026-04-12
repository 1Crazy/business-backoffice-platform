<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card filter-card">
    <div class="section-heading">
      <div>
        <div class="section-kicker">商机管理</div>
        <h2>商机筛选</h2>
        <p>按客户、阶段和结果筛选。</p>
      </div>
      <div class="section-actions">
        <el-select
          :model-value="sortPreset"
          placeholder="排序方式"
          class="sort-select"
          @update:model-value="$emit('update:sort-preset', $event)"
        >
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button @click="$emit('reset')">重置</el-button>
        <el-button type="primary" @click="$emit('create-opportunity')">新建商机</el-button>
      </div>
    </div>

    <el-form class="filter-form" label-position="top">
      <div class="field field-span-4">
        <el-form-item label="关键字">
          <el-input v-model="filters.keyword" placeholder="商机 / 客户 / 线索名称" clearable />
        </el-form-item>
      </div>
      <div class="field field-span-4">
        <el-form-item label="关联客户">
          <el-select v-model="filters.customerId" placeholder="全部客户" clearable filterable :loading="loading">
            <el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field field-span-4">
        <el-form-item label="归属人">
          <el-select v-model="filters.ownerId" placeholder="全部归属人" clearable filterable :loading="loading">
            <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field field-span-3">
        <el-form-item label="阶段">
          <el-select v-model="filters.stage" placeholder="全部阶段" clearable>
            <el-option v-for="item in stageOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field field-span-3">
        <el-form-item label="结果">
          <el-select v-model="filters.resultStatus" placeholder="全部结果" clearable>
            <el-option v-for="item in resultOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </div>
      <div class="field field-span-6">
        <el-form-item label="预计成交时间">
          <el-date-picker
            v-model="filters.expectedCloseDateRange"
            class="field-control"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            unlink-panels
          />
        </el-form-item>
      </div>
      <div class="field field-span-6">
        <el-form-item label="收口时间">
          <el-date-picker
            v-model="filters.closedAtRange"
            class="field-control"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            unlink-panels
          />
        </el-form-item>
      </div>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import type { User } from "@/types/access-control";
import type { OpportunityFilters, OpportunityResultStatus, OpportunityStage } from "@/types/opportunities";

defineProps<{
  filters: OpportunityFilters;
  loading: boolean;
  customers: Array<{ id: string; name: string }>;
  users: User[];
  stageOptions: Array<{ value: OpportunityStage; label: string }>;
  resultOptions: Array<{ value: OpportunityResultStatus; label: string }>;
  sortOptions: ReadonlyArray<{ value: string; label: string }>;
  sortPreset: string;
}>();

defineEmits<{
  reset: [];
  "create-opportunity": [];
  "update:sort-preset": [value: string];
}>();
</script>

<style scoped>
.filter-card {
  display: grid;
  gap: 20px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.section-kicker {
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 8px 0 6px;
  font-size: 24px;
  line-height: 1.2;
}

.section-heading p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.sort-select {
  width: 180px;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0 16px;
}

.field {
  grid-column: span 12;
}

.field-span-3 {
  grid-column: span 3;
}

.field-span-4 {
  grid-column: span 4;
}

.field-span-6 {
  grid-column: span 6;
}

.filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 14px;
}

.filter-form :deep(.el-form-item__label) {
  min-height: 18px;
  margin-bottom: 6px;
  line-height: 18px;
  font-weight: 600;
  color: var(--app-text-secondary);
}

.filter-form :deep(.el-form-item__content),
.filter-form :deep(.el-input),
.filter-form :deep(.el-select),
.filter-form :deep(.el-date-editor) {
  width: 100%;
}

.field-control {
  width: 100%;
}

@media (max-width: 960px) {
  .section-heading {
    flex-direction: column;
  }

  .filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-span-3,
  .field-span-4,
  .field-span-6 {
    grid-column: span 1;
  }

  .section-actions,
  .sort-select {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .filter-form {
    grid-template-columns: 1fr;
  }
}
</style>
