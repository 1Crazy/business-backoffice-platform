<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="reminder-grid">
    <article class="page-card reminder-summary">
      <span>待办提醒</span>
      <strong>{{ tableState.total }}</strong>
      <p>按当前权限范围汇总，还未处理的线索/客户提醒都会显示在这里。</p>
    </article>
    <section class="page-card reminder-list">
      <div class="list-head">
        <div>
          <h3>最近提醒</h3>
          <p>只展示当前分页内的提醒，翻页后会保留筛选状态。</p>
        </div>
        <el-button text @click="$emit('refresh')">刷新</el-button>
      </div>
      <el-empty v-if="!reminders.length" description="暂无待办提醒" />
      <ul v-else>
        <li v-for="item in reminders" :key="item.id">
          <span>{{ item.owner?.displayName ?? "-" }}</span>
          <strong>{{ item.lead?.name ?? item.customer?.name ?? "未命名记录" }}</strong>
          <small>{{ item.remindAt }}</small>
        </li>
      </ul>
      <el-pagination
        class="mini-pagination"
        :current-page="tableState.page"
        :page-size="tableState.pageSize"
        :total="tableState.total"
        small
        background
        layout="prev, pager, next"
        @current-change="$emit('page-change', $event)"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import type { ReminderListItem } from "@/types/follow-ups";
import type { ReminderTableState } from "@/types/leads";

defineProps<{
  reminders: ReminderListItem[];
  tableState: ReminderTableState;
}>();

defineEmits<{
  refresh: [];
  "page-change": [page: number];
}>();
</script>

<style scoped>
.reminder-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
}

.reminder-summary {
  display: grid;
  gap: 10px;
}

.reminder-summary span {
  color: #64748b;
}

.reminder-summary strong {
  font-size: 36px;
  color: #0f172a;
}

.reminder-summary p {
  margin: 0;
  color: #64748b;
  line-height: 1.8;
}

.reminder-list ul {
  margin: 0;
  padding-left: 18px;
}

.reminder-list li {
  margin-bottom: 10px;
  color: #334155;
}

.reminder-list span,
.reminder-list small {
  display: block;
  color: #64748b;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.mini-pagination {
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .reminder-grid {
    grid-template-columns: 1fr;
  }
}
</style>
