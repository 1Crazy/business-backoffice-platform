<template>
  <article class="revenue-section">
    <div class="revenue-section-head">
      <strong>{{ title }}</strong>
      <span>{{ count }}</span>
    </div>
    <slot />
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  count: number;
}>();
</script>

<style scoped>
.revenue-section {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.78);
}

.revenue-section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
</style>
