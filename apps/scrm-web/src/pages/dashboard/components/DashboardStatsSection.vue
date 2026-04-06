<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <div class="stats-grid">
    <article v-for="card in cards" :key="card.label" class="page-card stat-card">
      <div class="stat-label">{{ card.label }}</div>
      <div class="stat-value">{{ card.value }}</div>
      <div class="stat-caption">{{ card.caption }}</div>
    </article>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cards: Array<{
    label: string;
    value: string | number;
    caption: string;
  }>;
}>();
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: "";
  position: absolute;
  inset: auto -30px -60px auto;
  width: 140px;
  height: 140px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
}

.stat-label {
  color: #64748b;
  font-size: 14px;
}

.stat-value {
  margin-top: 18px;
  font-size: clamp(34px, 5vw, 48px);
  font-weight: 700;
  color: #0f172a;
}

.stat-caption {
  margin-top: 14px;
  color: #475569;
  line-height: 1.7;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
