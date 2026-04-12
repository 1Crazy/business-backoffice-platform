<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <div class="stats-grid">
    <article v-for="(card, index) in cards" :key="card.label" class="page-card stat-card">
      <div class="stat-head">
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-index">0{{ index + 1 }}</div>
      </div>
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 10px;
  min-height: 152px;
  padding: 18px 18px 16px;
}

.stat-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.9), rgba(37, 99, 235, 0.14));
}

.stat-card::after {
  content: "";
  position: absolute;
  inset: auto -28px -56px auto;
  width: 132px;
  height: 132px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(148, 163, 184, 0.14), transparent 72%);
}

.stat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.stat-label {
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}

.stat-caption {
  margin-top: auto;
  max-width: 240px;
  color: var(--app-text-secondary);
  line-height: 1.55;
  font-size: 12px;
}

.stat-value {
  font-size: clamp(28px, 3.2vw, 36px);
  font-weight: 700;
  color: var(--app-text-primary);
  letter-spacing: -0.04em;
}

.stat-index {
  flex: none;
  color: rgba(100, 116, 139, 0.22);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.06em;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
