<template>
  <section class="summary-grid">
    <article v-for="item in items" :key="item.label" class="summary-card">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
      <small :class="item.tone">{{ item.tone === 'warning' ? '需关注' : '稳定' }}</small>
    </article>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{
    label: string;
    value: number;
    tone: "healthy" | "warning";
  }>;
}>();
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.summary-card span,
.summary-card small {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-card strong {
  font-size: 30px;
  line-height: 1;
}

.summary-card small.warning {
  color: #b45309;
}

.summary-card small.healthy {
  color: #0f766e;
}

@media (max-width: 1080px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
