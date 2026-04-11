<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <div class="brand">
        <div class="brand-badge">OA</div>
        <div class="brand-copy">
          <div class="brand-kicker">办公协同</div>
          <div class="brand-title">OA 办公台</div>
        </div>
      </div>

      <div class="menu-meta">
        <span class="menu-label">导航目录</span>
        <span class="menu-count">{{ items.length }}</span>
      </div>

      <el-menu :default-active="activePath" class="menu" router>
        <el-menu-item v-for="item in items" :key="item.path" :index="item.path">
          {{ item.title }}
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <span class="sidebar-footer-title">统一身份</span>
        <span class="sidebar-footer-caption">适合嵌入主应用的轻量办公微前端</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  activePath: string;
  items: Array<{
    path: string;
    title: string;
  }>;
}>();
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: var(--app-shell-min-height, 100vh);
  padding: 16px 10px 16px 16px;
  color: var(--app-text-primary);
}

.sidebar-inner {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 12px;
  height: calc(var(--app-shell-min-height, 100vh) - 32px);
  padding: 12px;
  border-radius: 24px;
  border: 1px solid rgba(125, 148, 171, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(243, 247, 246, 0.94) 100%);
  box-shadow: 0 18px 38px rgba(23, 32, 43, 0.06);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(125, 148, 171, 0.12);
}

.brand-badge {
  min-width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #14b8a6, #0f766e);
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-copy {
  min-width: 0;
}

.brand-kicker {
  color: var(--app-text-tertiary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.menu-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 4px 0;
}

.menu-label,
.sidebar-footer-title {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.menu-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding-inline: 8px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.08);
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
}

.menu {
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  border-right: none;
  background: transparent;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.menu::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.menu::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: transparent;
}

.menu:hover,
.menu:focus-within {
  scrollbar-width: thin;
}

.menu:hover::-webkit-scrollbar,
.menu:focus-within::-webkit-scrollbar {
  width: 6px;
}

.menu:hover::-webkit-scrollbar-thumb,
.menu:focus-within::-webkit-scrollbar-thumb {
  background: rgba(125, 148, 171, 0.3);
}

:deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin-bottom: 4px;
  padding: 0 12px;
  color: var(--app-text-secondary);
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

:deep(.el-menu-item:hover) {
  background: rgba(15, 118, 110, 0.08);
}

:deep(.el-menu-item.is-active) {
  color: var(--app-accent-strong);
  background:
    linear-gradient(135deg, rgba(15, 118, 110, 0.16), rgba(15, 118, 110, 0.08)),
    rgba(255, 255, 255, 0.96);
}

.sidebar-footer {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.64);
}

.sidebar-footer-title {
  color: var(--app-accent-strong);
}

.sidebar-footer-caption {
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }
}
</style>
