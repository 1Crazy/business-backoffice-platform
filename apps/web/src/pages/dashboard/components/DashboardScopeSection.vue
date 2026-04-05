<template>
  <section class="page-card scope-card">
    <div>
      <span class="scope-kicker">Metrics / Unified Scope</span>
      <h3>统计口径提示</h3>
      <p>客户、线索、跟进和提醒都按照同一数据范围规则收口，所以看板与业务列表的数字应该互相对得上。</p>
    </div>
    <ul class="scope-list">
      <li>如果你和主管看到的数据不同，通常是角色数据范围不同，而不是统计口径不一致。</li>
      <li v-if="isOverviewEmpty">当前时间范围和数据范围下暂无业务数据，可以切换日期或确认账号权限范围。</li>
      <li v-else>当前周期内已有数据，列表页筛选相同条件后应能复现这些统计结果。</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  isOverviewEmpty: boolean;
}>();
</script>

<style scoped>
.scope-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background:
    linear-gradient(135deg, rgba(30, 64, 175, 0.06), transparent 42%),
    linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent 58%),
    #ffffff;
}

.scope-kicker {
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

.scope-card h3 {
  margin: 0 0 8px;
}

.scope-card p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.scope-list {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
}

@media (max-width: 960px) {
  .scope-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
