<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card scope-card">
    <div class="scope-copy">
      <span class="scope-kicker">统一口径 / 数据范围</span>
      <h3>统计口径提示</h3>
      <p>客户、线索、跟进和提醒都按照同一数据范围规则收口，所以看板与业务列表的数字应该互相对得上。</p>
    </div>
    <div class="scope-list">
      <article class="scope-item">
        <strong>权限解释</strong>
        <p>如果你和主管看到的数据不同，通常是角色数据范围不同，而不是统计口径不一致。</p>
      </article>
      <article class="scope-item">
        <strong>{{ isOverviewEmpty ? "当前状态" : "校验方式" }}</strong>
        <p>{{ isOverviewEmpty ? "当前时间范围和数据范围下暂无业务数据，可以切换日期或确认账号权限范围。" : "当前周期内已有数据，列表页筛选相同条件后应能复现这些统计结果。" }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  isOverviewEmpty: boolean;
}>();
</script>

<style scoped>
.scope-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
  gap: 20px;
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
  font-weight: 700;
  letter-spacing: 0.03em;
}

.scope-card h3 {
  margin: 0 0 8px;
}

.scope-card p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.scope-list {
  display: grid;
  gap: 12px;
}

.scope-item {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(248, 251, 255, 0.82);
  border: 1px solid rgba(95, 125, 170, 0.14);
}

.scope-item strong {
  display: block;
  margin-bottom: 8px;
  color: var(--app-text-primary);
}

@media (max-width: 960px) {
  .scope-card {
    grid-template-columns: 1fr;
  }
}
</style>
