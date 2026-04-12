<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card filter-card">
    <div class="section-heading">
      <div>
        <div class="section-kicker">运营看板</div>
        <h2>看板筛选</h2>
        <p>按统计周期、团队和负责人切换数据口径，快速定位当前经营范围。</p>
      </div>

      <div class="section-actions">
        <span v-if="refreshing" class="loading-badge">数据同步中</span>
        <el-button class="toolbar-reset" @click="$emit('reset')">重置筛选</el-button>
      </div>
    </div>

    <el-form class="filter-form" label-position="top">
      <div class="field field-span-6">
        <el-form-item label="统计周期">
          <el-date-picker
            v-model="dateRangeModel"
            class="field-control"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="$emit('change')"
          />
        </el-form-item>
      </div>

      <div class="field field-span-3">
        <el-form-item label="团队">
          <el-select
            v-model="departmentModel"
            placeholder="全部团队"
            clearable
            filterable
            @change="handleDepartmentChange"
          >
            <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </div>

      <div class="field field-span-3">
        <el-form-item label="负责人">
          <el-select
            v-model="ownerModel"
            placeholder="全部负责人"
            clearable
            filterable
            @change="$emit('change')"
          >
            <el-option v-for="item in owners" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
      </div>
    </el-form>

    <div class="filter-hint">
      切换团队后会自动清空负责人，避免跨团队筛选导致统计口径混淆。
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type {
  DashboardDateRange,
  DashboardDepartmentFilterOption,
  DashboardOwnerFilterOption
} from "@/types/dashboard";

const props = defineProps<{
  dateRange: DashboardDateRange;
  departmentId?: string;
  ownerId?: string;
  departments: DashboardDepartmentFilterOption[];
  owners: DashboardOwnerFilterOption[];
  refreshing?: boolean;
}>();

const emit = defineEmits<{
  "update:dateRange": [value: DashboardDateRange];
  "update:departmentId": [value: string | undefined];
  "update:ownerId": [value: string | undefined];
  change: [];
  reset: [];
}>();

const dateRangeModel = computed({
  get: () => props.dateRange,
  set: (value: DashboardDateRange) => emit("update:dateRange", value)
});

const departmentModel = computed({
  get: () => props.departmentId,
  set: (value: string | undefined) => emit("update:departmentId", value)
});

const ownerModel = computed({
  get: () => props.ownerId,
  set: (value: string | undefined) => emit("update:ownerId", value)
});

function handleDepartmentChange() {
  emit("update:ownerId", undefined);
  emit("change");
}
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

.toolbar-reset {
  min-width: 104px;
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

.filter-hint {
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .section-heading {
    flex-direction: column;
  }

  .section-actions {
    width: 100%;
  }

  .filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-span-3,
  .field-span-6 {
    grid-column: span 1;
  }

  .toolbar-reset {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .filter-form {
    grid-template-columns: 1fr;
  }
}
</style>
