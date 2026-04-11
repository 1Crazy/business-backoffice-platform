<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <div class="brand">
        <div class="brand-badge">S</div>
        <div class="brand-copy">
          <div class="brand-kicker">销售运营</div>
          <div class="brand-title">SCRM 控制台</div>
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
  padding: var(--app-shell-gutter, 8px) 8px var(--app-shell-gutter, 8px) var(--app-shell-gutter, 8px);
  color: #e2e8f0;
}

.sidebar-inner {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  height: calc(var(--app-shell-min-height, 100vh) - (var(--app-shell-gutter, 8px) * 2));
  padding: 12px 8px 12px 12px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 24%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.22), transparent 28%),
    linear-gradient(180deg, #0f172a 0%, #0f1b34 48%, #12203d 100%);
  box-shadow: 0 30px 60px rgba(2, 6, 23, 0.28);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.brand-copy {
  min-width: 0;
}

.brand-kicker {
  color: #7f93b8;
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

.menu-label {
  color: #7f93b8;
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
  background: rgba(59, 130, 246, 0.18);
  color: #dbeafe;
  font-size: 11px;
  font-weight: 700;
}

.menu {
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
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

:deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin-bottom: 4px;
  margin-right: 4px;
  padding: 0 12px;
  color: #d9e2f1;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

:deep(.el-menu-item:hover) {
  background: rgba(59, 130, 246, 0.12);
}

:deep(.el-menu-item.is-active) {
  color: white;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.48), rgba(29, 78, 216, 0.34));
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.2);
}

@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }
}
</style>
