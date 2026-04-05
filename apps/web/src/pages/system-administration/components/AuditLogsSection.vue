<template>
  <section>
    <el-form class="audit-filter-form" label-position="top">
      <el-form-item label="操作人">
        <el-input v-model="filter.actorName" placeholder="按操作人筛选" class="filter-input" />
      </el-form-item>
      <el-form-item label="动作类型">
        <el-select v-model="filter.actionType" clearable placeholder="全部动作">
          <el-option v-for="item in auditActionOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="对象类型">
        <el-select v-model="filter.targetType" clearable placeholder="全部对象">
          <el-option v-for="item in auditTargetTypeOptions" :key="item" :label="item" :value="item" />
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
      <p>认证、分配、转换和修改动作都会进入日志列表，筛选后仍保持服务端分页与时间口径一致。</p>
      <el-button @click="$emit('refresh')">刷新</el-button>
    </div>

    <div class="table-meta">
      <div>
        <span class="table-kicker">Audit Trail</span>
        <h3>审计结果</h3>
        <p>当前筛选下共 {{ tableState.total }} 条日志，便于按动作与时间区间快速追溯。</p>
      </div>
      <div class="meta-pill">第 {{ tableState.page }} / {{ Math.max(tableState.totalPages, 1) }} 页</div>
    </div>

    <div v-if="auditLogs.length" class="page-table-shell">
      <el-table :data="auditLogs" border>
        <el-table-column prop="actorName" label="操作人" min-width="160" />
        <el-table-column prop="actionType" label="动作" min-width="140" />
        <el-table-column prop="targetType" label="对象类型" min-width="140" />
        <el-table-column prop="targetId" label="对象 ID" min-width="220" />
        <el-table-column prop="createdAt" label="时间" min-width="180" />
      </el-table>
    </div>
    <el-empty v-else description="当前筛选条件下暂无审计日志" />

    <div class="pagination-row">
      <span class="pagination-caption">每页 {{ tableState.pageSize }} 条，当前排序：{{ currentSortLabel }}</span>
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
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AuditLog } from "@/types/audit-logs";
import type { AuditLogFilters, AuditLogTableState } from "@/types/system-administration";

const props = defineProps<{
  filter: AuditLogFilters;
  auditLogs: AuditLog[];
  auditActionOptions: readonly string[];
  auditTargetTypeOptions: readonly string[];
  auditSortOptions: ReadonlyArray<{ value: string; label: string }>;
  tableState: AuditLogTableState;
  currentSortLabel: string;
}>();

const emit = defineEmits<{
  refresh: [];
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
  color: #64748b;
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
  background: rgba(30, 64, 175, 0.08);
  color: #1e40af;
  font-size: 12px;
  font-family: "Fira Code", monospace;
  letter-spacing: 0.04em;
}

.table-meta h3 {
  margin: 0 0 6px;
}

.table-meta p,
.pagination-caption {
  margin: 0;
  color: #64748b;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(245, 158, 11, 0.12));
  color: #1e3a8a;
  font-weight: 600;
  white-space: nowrap;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
