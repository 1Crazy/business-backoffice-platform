<template>
  <section class="page-card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style scoped>
h2 {
  margin: 0 0 12px;
}

p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}
</style>
