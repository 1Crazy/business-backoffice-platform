<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card scope-card">
    <div class="scope-copy">
      <span class="scope-kicker">数据范围</span>
      <h3>统计范围</h3>
      <p>看板数字与列表筛选保持一致。</p>
    </div>
    <div class="scope-list">
      <article class="scope-item">
        <strong>账号范围</strong>
        <p>不同角色看到的数据可能不同。</p>
      </article>
      <article class="scope-item">
        <strong>{{ isOverviewEmpty ? "当前状态" : "校验方式" }}</strong>
        <p>{{ isOverviewEmpty ? "当前范围暂无数据。" : "同条件下可在列表页复现。" }}</p>
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
    linear-gradient(135deg, rgba(37, 99, 235, 0.06), transparent 42%),
    linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent 58%),
    #ffffff;
}

.scope-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
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
