<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <nav class="page-card mobile-nav-card mobile-nav" aria-label="快捷导航">
    <div class="mobile-nav-copy">
      <span>快捷导航</span>
      <strong>{{ currentTitle }}</strong>
    </div>
    <div class="mobile-nav-links">
      <button
        v-for="item in items"
        :key="item.path"
        type="button"
        class="mobile-nav-link"
        :class="{ active: activePath === item.path }"
        @click="$emit('navigate', item.path)"
      >
        {{ item.title }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  activePath: string;
  currentTitle: string;
  items: Array<{
    path: string;
    title: string;
  }>;
}>();

defineEmits<{
  navigate: [path: string];
}>();
</script>

<style scoped>
.mobile-nav-card {
  display: none;
  gap: 12px;
  margin-bottom: 20px;
}

.mobile-nav-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mobile-nav-copy span {
  color: #64748b;
  font-size: 13px;
}

.mobile-nav-copy strong {
  color: #0f172a;
  font-size: 14px;
}

.mobile-nav-links {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 2px 2px;
  scrollbar-width: thin;
}

.mobile-nav-link {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #e2e8f0;
  color: #334155;
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.mobile-nav-link:hover {
  background: #dbeafe;
  color: #1d4ed8;
  transform: translateY(-1px);
}

.mobile-nav-link.active {
  background: #1d4ed8;
  color: white;
}

@media (max-width: 1024px) {
  .mobile-nav-card {
    display: grid;
  }
}

@media (max-width: 640px) {
  .mobile-nav-card {
    margin-bottom: 16px;
  }
}
</style>
