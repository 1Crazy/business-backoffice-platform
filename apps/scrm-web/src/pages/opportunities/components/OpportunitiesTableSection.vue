<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card table-card">
    <div class="section-heading">
      <div>
        <div class="section-title">商机列表</div>
        <div class="section-caption">当前排序：{{ currentSortLabel }}</div>
      </div>
      <el-tag type="info">共 {{ tableState.total }} 条</el-tag>
    </div>

    <div class="page-table-shell">
      <el-table :data="opportunities" :loading="loading || refreshing" empty-text="暂无商机数据" stripe>
        <el-table-column prop="name" label="商机名称" min-width="180" />
        <el-table-column label="客户" min-width="180">
          <template #default="{ row }">
            <div class="cell-stack">
              <strong>{{ row.customer.name }}</strong>
              <span>{{ row.owner.displayName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="阶段 / 结果" min-width="180">
          <template #default="{ row }">
            <div class="stage-result-cell">
              <el-tag class="stage-chip" :type="resolveStageTagType(row.resultStatus)">
                {{ formatOpportunityStage(row.stage) }}
              </el-tag>
              <span
                v-if="shouldShowResultChip(row)"
                class="result-chip"
                :class="`is-${row.resultStatus.toLowerCase()}`"
              >
                {{ formatOpportunityResult(row.resultStatus) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预计金额" min-width="140">
          <template #default="{ row }">
            {{ formatAmount(row.expectedAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="预计成交" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.expectedCloseDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="nextAction" label="下一步动作" min-width="220" show-overflow-tooltip />
        <el-table-column label="更新时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-row">
              <el-button text @click="$emit('detail', row)">详情</el-button>
              <el-button text @click="$emit('edit', row)">编辑</el-button>
              <el-button text @click="$emit('transfer', row)">转交</el-button>
              <el-button text :disabled="row.resultStatus !== 'IN_PROGRESS'" @click="$emit('advance', row)">推进</el-button>
              <el-button text type="success" :disabled="row.resultStatus !== 'IN_PROGRESS'" @click="$emit('mark-won', row)">
                赢单
              </el-button>
              <el-button text type="danger" :disabled="row.resultStatus !== 'IN_PROGRESS'" @click="$emit('mark-lost', row)">
                输单
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-row">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :current-page="tableState.page"
        :page-size="tableState.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="tableState.total"
        @current-change="$emit('page-change', $event)"
        @size-change="$emit('page-size-change', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Opportunity, OpportunityTableState } from "@/types/opportunities";
import { formatAmount, formatDateTime, formatOpportunityResult, formatOpportunityStage } from "@/utils/display";

function resolveStageTagType(resultStatus: Opportunity["resultStatus"]): "success" | "danger" | "warning" {
  if (resultStatus === "WON") {
    return "success";
  }

  if (resultStatus === "LOST") {
    return "danger";
  }

  return "warning";
}

function shouldShowResultChip(opportunity: Opportunity): boolean {
  return !(
    (opportunity.stage === "CLOSED_WON" && opportunity.resultStatus === "WON") ||
    (opportunity.stage === "CLOSED_LOST" && opportunity.resultStatus === "LOST")
  );
}

defineProps<{
  opportunities: Opportunity[];
  loading: boolean;
  refreshing: boolean;
  tableState: OpportunityTableState;
  currentSortLabel: string;
}>();

defineEmits<{
  detail: [value: Opportunity];
  edit: [value: Opportunity];
  transfer: [value: Opportunity];
  advance: [value: Opportunity];
  "mark-won": [value: Opportunity];
  "mark-lost": [value: Opportunity];
  "page-change": [value: number];
  "page-size-change": [value: number];
}>();
</script>

<style scoped>
.table-card {
  display: grid;
  gap: 16px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.section-caption {
  margin-top: 4px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.cell-stack {
  display: grid;
  gap: 4px;
}

.cell-stack span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.stage-result-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.stage-chip {
  max-width: 100%;
}

.result-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.result-chip.is-in_progress {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.result-chip.is-won {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.result-chip.is-lost {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.page-table-shell :deep(.el-table__fixed-right),
.page-table-shell :deep(.el-table__fixed-right-patch) {
  background: rgba(248, 251, 255, 0.96);
}

.page-table-shell :deep(.el-table__fixed-right th.el-table__cell),
.page-table-shell :deep(.el-table__fixed-right td.el-table__cell) {
  background: rgba(248, 251, 255, 0.96);
}

.page-table-shell :deep(.el-table .el-table-fixed-column--right.is-first-column) {
  box-shadow: -12px 0 20px rgba(15, 23, 42, 0.06);
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .section-heading,
  .pagination-row {
    justify-content: flex-start;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
