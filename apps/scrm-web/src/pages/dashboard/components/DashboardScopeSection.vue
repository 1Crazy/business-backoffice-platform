<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card scope-card">
    <div class="scope-copy">
      <span class="page-kicker">数据范围</span>
      <h3 class="page-section-title">统计口径说明</h3>
      <p class="page-section-caption">看板数字与客户、线索、商机、回款和审批数据范围保持一致。</p>
    </div>
    <div class="scope-list">
      <article class="scope-item">
        <strong>当前筛选</strong>
        <p>{{ `${departmentName} / ${ownerName}` }}</p>
      </article>
      <article class="scope-item">
        <strong>可选范围</strong>
        <p>{{ `${departmentCount} 个团队，${ownerCount} 位负责人` }}</p>
      </article>
      <article class="scope-item">
        <strong>{{ isOverviewEmpty ? "当前状态" : "校验方式" }}</strong>
        <p>{{ isOverviewEmpty ? "当前范围暂无数据。" : "同条件下可在列表页与审批页复现。" }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  isOverviewEmpty: boolean;
  departmentName: string;
  ownerName: string;
  departmentCount: number;
  ownerCount: number;
}>();
</script>

<style scoped>
.scope-card {
  display: grid;
  gap: 16px;
}

.scope-copy {
  display: grid;
  gap: 8px;
  align-content: start;
}

.scope-copy :deep(.page-kicker) {
  justify-self: start;
}

.scope-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.scope-item {
  display: grid;
  gap: 6px;
  align-content: start;
  min-height: 108px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(248, 251, 255, 0.72);
  border: 1px solid rgba(95, 125, 170, 0.14);
}

.scope-item strong {
  display: block;
  color: var(--app-text-primary);
  font-size: 14px;
}

.scope-item p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
  font-size: 13px;
}

@media (max-width: 960px) {
  .scope-list {
    grid-template-columns: 1fr;
  }
}
</style>
