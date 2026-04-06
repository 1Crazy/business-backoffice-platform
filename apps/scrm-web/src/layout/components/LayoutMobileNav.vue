<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <nav class="page-card mobile-nav-card mobile-nav" aria-label="快捷导航">
    <div class="mobile-nav-copy">
      <span>销售运营</span>
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
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 18px;
}

.mobile-nav-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mobile-nav-copy span {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mobile-nav-copy strong {
  color: var(--app-text-primary);
  font-size: 14px;
}

.mobile-nav-links {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 0;
  scrollbar-width: thin;
}

.mobile-nav-link {
  border: none;
  border-radius: 14px;
  padding: 8px 12px;
  background: rgba(232, 239, 252, 0.9);
  color: var(--app-text-secondary);
  font: inherit;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.mobile-nav-link:hover {
  background: rgba(30, 64, 175, 0.1);
  color: var(--app-accent-strong);
  transform: translateY(-1px);
}

.mobile-nav-link.active {
  background: linear-gradient(135deg, var(--app-accent) 0%, #2856e1 100%);
  color: white;
  box-shadow: 0 14px 28px rgba(30, 64, 175, 0.18);
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
