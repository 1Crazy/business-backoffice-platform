<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section>
    <template v-if="loading">
      <div class="table-skeleton">
        <div class="table-skeleton-row">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line long" />
        </div>
        <div v-for="item in 4" :key="item" class="table-skeleton-row">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line short" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <span class="ui-skeleton ui-skeleton-line medium" />
        </div>
      </div>
    </template>
    <template v-else>
      <el-form class="audit-filter-form" label-position="top">
        <el-form-item label="操作人">
          <el-input v-model="filter.actorName" placeholder="按操作人筛选" class="filter-input" />
        </el-form-item>
        <el-form-item label="动作类型">
          <el-select v-model="filter.actionType" clearable placeholder="全部动作">
            <el-option v-for="item in auditActionOptions" :key="item" :label="formatAuditActionType(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="filter.targetType" clearable placeholder="全部对象">
            <el-option v-for="item in auditTargetTypeOptions" :key="item" :label="formatAuditTargetType(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="localSortPreset" placeholder="选择排序方式">
            <el-option v-for="item in auditSortOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="toolbar-row">
        <p>按操作人、动作和时间筛选。</p>
        <el-button @click="$emit('reset')">重置</el-button>
      </div>
      <div class="table-meta">
        <div>
          <span class="table-kicker">操作审计</span>
          <h3>审计结果</h3>
          <p>查看最近关键操作。</p>
        </div>
        <div class="meta-pill">{{ refreshing ? "结果同步中" : `排序：${currentSortLabel}` }}</div>
      </div>
      <div v-if="auditLogs.length" class="page-table-shell">
        <el-table :data="auditLogs" border>
          <el-table-column prop="actorName" label="操作人" min-width="160" />
          <el-table-column label="动作" min-width="140">
            <template #default="{ row }">
              {{ formatAuditActionType(row.actionType) }}
            </template>
          </el-table-column>
          <el-table-column label="对象类型" min-width="140">
            <template #default="{ row }">
              {{ formatAuditTargetType(row.targetType) }}
            </template>
          </el-table-column>
          <el-table-column prop="targetId" label="对象 ID" min-width="220" />
          <el-table-column label="时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="当前筛选条件下暂无审计日志" />
      <div class="pagination-row">
        <el-pagination
          :current-page="tableState.page"
          :page-size="tableState.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="tableState.total"
          background
          layout="total, sizes, prev, pager, next"
          @current-change="$emit('page-change', $event)"
          @size-change="$emit('page-size-change', $event)"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AuditLog } from "@/types/audit-logs";
import type { AuditLogFilters, AuditLogTableState } from "@/types/system-administration";
import { formatAuditActionType, formatAuditTargetType, formatDateTime } from "@/utils/display";

const props = defineProps<{
  filter: AuditLogFilters;
  auditLogs: AuditLog[];
  auditActionOptions: readonly string[];
  auditTargetTypeOptions: readonly string[];
  auditSortOptions: ReadonlyArray<{ value: string; label: string }>;
  loading?: boolean;
  refreshing?: boolean;
  tableState: AuditLogTableState;
  currentSortLabel: string;
}>();

const emit = defineEmits<{
  reset: [];
  "update:sortPreset": [value: string];
  "page-change": [page: number];
  "page-size-change": [pageSize: number];
}>();

const localSortPreset = computed({
  get: () => props.tableState.sortPreset,
  set: (value: string) => emit("update:sortPreset", value)
});
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
  min-width: 0;
  color: var(--app-text-secondary);
}

.table-skeleton {
  display: grid;
  gap: 12px;
}

.table-skeleton-row {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.62);
}

.filter-input,
.full-width {
  width: 100%;
}

.audit-filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
  margin-bottom: 16px;
}

.audit-filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 14px;
}

.audit-filter-form :deep(.el-form-item__content),
.audit-filter-form :deep(.el-input),
.audit-filter-form :deep(.el-select),
.audit-filter-form :deep(.el-date-editor) {
  width: 100%;
}

.table-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.table-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.table-meta h3 {
  margin: 0 0 6px;
}

.table-meta p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
  font-size: 13px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.08);
  color: #1e3a8a;
  font-weight: 600;
  white-space: nowrap;
  font-size: 12px;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
}

@media (max-width: 960px) {
  .toolbar-row,
  .table-meta,
  .pagination-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
