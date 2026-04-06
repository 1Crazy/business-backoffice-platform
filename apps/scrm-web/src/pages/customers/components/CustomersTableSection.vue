<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card table-card">
    <div class="table-meta">
      <div>
        <span class="table-kicker">Customers / Scoped Query</span>
        <h3>客户结果</h3>
        <p>当前筛选与数据范围交叉后，共返回 {{ tableState.total }} 条客户记录。</p>
      </div>
      <div class="meta-pill">第 {{ tableState.page }} / {{ Math.max(tableState.totalPages, 1) }} 页</div>
    </div>

    <div v-if="customers.length" class="page-table-shell">
      <el-table :data="customers" border>
        <el-table-column prop="name" label="客户名称" min-width="180" />
        <el-table-column prop="contactName" label="联系人" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="source" label="来源" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="120" />
        <el-table-column label="归属人" min-width="120">
          <template #default="{ row }">
            {{ row.owner?.displayName ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="220">
          <template #default="{ row }">
            <el-tag
              v-for="item in row.tags"
              :key="item.tag.id"
              class="tag-item"
              :style="{ borderColor: item.tag.color ?? '#cbd5e1', color: item.tag.color ?? '#334155' }"
            >
              {{ item.tag.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" :fixed="isDesktop ? 'right' : false">
          <template #default="{ row }">
            <el-button text @click="$emit('edit', row)">编辑</el-button>
            <el-button text @click="$emit('transfer', row)">转交</el-button>
            <el-button text @click="$emit('follow-up', row)">跟进</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="当前筛选和数据范围下暂无客户" />

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
import type { Customer, CustomerTableState } from "@/types/customers";

defineProps<{
  customers: Customer[];
  tableState: CustomerTableState;
  currentSortLabel: string;
  isDesktop: boolean;
}>();

defineEmits<{
  edit: [customer: Customer];
  transfer: [customer: Customer];
  "follow-up": [customer: Customer];
  "page-change": [page: number];
  "page-size-change": [pageSize: number];
}>();
</script>

<style scoped>
.table-card {
  display: grid;
  gap: 16px;
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

.tag-item {
  margin-right: 6px;
  margin-bottom: 6px;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
