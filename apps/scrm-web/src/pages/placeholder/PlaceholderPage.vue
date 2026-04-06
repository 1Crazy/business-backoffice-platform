<!-- placeholder 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
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
