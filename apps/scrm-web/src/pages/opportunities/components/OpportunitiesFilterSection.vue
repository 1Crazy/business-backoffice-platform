<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card filter-card">
    <div class="section-heading">
      <div>
        <div class="section-kicker">Pipeline View</div>
        <h2>商机筛选</h2>
        <p>按客户、归属人、阶段和结果快速收敛当前销售管道。</p>
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
        <el-button @click="$emit('refresh')">刷新</el-button>
        <el-button type="primary" @click="$emit('create-opportunity')">新建商机</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-form-item label="关键字">
          <el-input v-model="filters.keyword" placeholder="商机 / 客户 / 线索名称" clearable />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-form-item label="关联客户">
          <el-select v-model="filters.customerId" placeholder="全部客户" clearable filterable :loading="loading">
            <el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-form-item label="归属人">
          <el-select v-model="filters.ownerId" placeholder="全部归属人" clearable filterable :loading="loading">
            <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-form-item label="阶段">
          <el-select v-model="filters.stage" placeholder="全部阶段" clearable>
            <el-option v-for="item in stageOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-form-item label="结果">
          <el-select v-model="filters.resultStatus" placeholder="全部结果" clearable>
            <el-option v-for="item in resultOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-form-item label="预计成交时间">
          <el-date-picker
            v-model="filters.expectedCloseDateRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            unlink-panels
          />
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-form-item label="收口时间">
          <el-date-picker
            v-model="filters.closedAtRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="至"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            unlink-panels
          />
        </el-form-item>
      </el-col>
    </el-row>
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
  refresh: [];
  "create-opportunity": [];
  "update:sort-preset": [value: string];
}>();
</script>

<style scoped>
.filter-card {
  display: grid;
  gap: 18px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
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
}

.section-heading p {
  margin: 0;
  color: var(--app-text-secondary);
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

@media (max-width: 960px) {
  .section-heading {
    flex-direction: column;
  }

  .section-actions,
  .sort-select {
    width: 100%;
  }
}
</style>
