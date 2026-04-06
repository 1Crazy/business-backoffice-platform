<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card table-card">
    <template v-if="loading">
      <div class="table-meta">
        <div class="skeleton-stack">
          <span class="ui-skeleton ui-skeleton-pill" />
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line long" />
        </div>
      </div>
      <div class="table-skeleton">
        <div v-for="item in 5" :key="item" class="table-skeleton-row">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line short" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <span class="ui-skeleton ui-skeleton-line medium" />
        </div>
      </div>
    </template>

    <template v-else>
    <div class="table-meta">
      <div>
        <span class="table-kicker">线索列表</span>
        <h3>线索结果</h3>
        <p>结果已按当前筛选条件、权限范围和排序方式同步更新。</p>
      </div>
      <div class="meta-pill">{{ refreshing ? "结果同步中" : `排序：${currentSortLabel}` }}</div>
    </div>

    <div v-if="leads.length" class="page-table-shell">
      <el-table :data="leads" border>
        <el-table-column prop="name" label="线索名称" min-width="180" />
        <el-table-column prop="contactName" label="联系人" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column label="来源" min-width="120">
          <template #default="{ row }">
            {{ formatDictionaryValue(row.source, sourceOptions) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            {{ formatLeadStatus(row.status) }}
          </template>
        </el-table-column>
        <el-table-column label="归属人" min-width="120">
          <template #default="{ row }">
            {{ row.owner?.displayName ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="转化结果" min-width="180">
          <template #default="{ row }">
            {{ row.convertedCustomer?.name ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="340" :fixed="isDesktop ? 'right' : false">
          <template #default="{ row }">
            <el-button text @click="$emit('edit', row)">编辑</el-button>
            <el-button text @click="$emit('assign', row)">分配</el-button>
            <el-button text :disabled="row.status === 'CONVERTED'" @click="$emit('convert', row)">转客户</el-button>
            <el-button text @click="$emit('follow-up', row)">跟进</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="当前筛选和数据范围下暂无线索" />

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
import type { DictionaryEntry } from "@/types/dictionaries";
import type { Lead, LeadTableState } from "@/types/leads";
import { formatDictionaryValue, formatLeadStatus } from "@/utils/display";

defineProps<{
  leads: Lead[];
  loading?: boolean;
  refreshing?: boolean;
  tableState: LeadTableState;
  currentSortLabel: string;
  sourceOptions: DictionaryEntry[];
  isDesktop: boolean;
}>();

defineEmits<{
  edit: [lead: Lead];
  assign: [lead: Lead];
  convert: [lead: Lead];
  "follow-up": [lead: Lead];
  "page-change": [page: number];
  "page-size-change": [pageSize: number];
}>();
</script>

<style scoped>
.table-card {
  display: grid;
  gap: 16px;
}

.skeleton-stack,
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

.table-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.table-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: var(--app-accent-strong);
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
  background: rgba(30, 64, 175, 0.08);
  color: var(--app-accent-strong);
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
}

@media (max-width: 960px) {
  .table-meta,
  .pagination-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
