<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <div class="stats-grid">
    <article v-for="(card, index) in cards" :key="card.label" class="page-card stat-card" :class="`tone-${index + 1}`">
      <div class="stat-label">{{ card.label }}</div>
      <div class="stat-value">{{ card.value }}</div>
      <div class="stat-caption">{{ card.caption }}</div>
      <div class="stat-index">0{{ index + 1 }}</div>
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 4px;
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
  color: var(--app-text-tertiary);
  font-size: 14px;
}

.stat-value {
  margin-top: 18px;
  font-size: clamp(34px, 5vw, 48px);
  font-weight: 700;
  color: var(--app-text-primary);
}

.stat-caption {
  margin-top: 14px;
  max-width: 240px;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.stat-index {
  position: absolute;
  inset: 18px 18px auto auto;
  color: rgba(78, 95, 124, 0.18);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.06em;
}

.tone-1 {
  background:
    linear-gradient(135deg, rgba(30, 64, 175, 0.08), transparent 56%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
}

.tone-2 {
  background:
    linear-gradient(135deg, rgba(56, 189, 248, 0.1), transparent 56%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
}

.tone-3 {
  background:
    linear-gradient(135deg, rgba(213, 138, 17, 0.12), transparent 56%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
