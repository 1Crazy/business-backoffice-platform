<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-badge">S</div>
      <div>
        <div class="brand-title">SCRM 控制台</div>
        <div class="brand-subtitle">Sales & Customer Ops</div>
      </div>
    </div>

    <el-menu :default-active="activePath" class="menu" router>
      <el-menu-item v-for="item in items" :key="item.path" :index="item.path">
        {{ item.title }}
      </el-menu-item>
    </el-menu>
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
  padding: 20px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(148, 163, 184, 0.14);
}

.brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: white;
  font-size: 22px;
  font-weight: 700;
}

.brand-title {
  font-size: 17px;
  font-weight: 700;
}

.brand-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.menu {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  color: #cbd5e1;
  border-radius: 14px;
  margin-bottom: 8px;
}

:deep(.el-menu-item.is-active) {
  color: white;
  background: rgba(59, 130, 246, 0.24);
}

@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }
}
</style>
