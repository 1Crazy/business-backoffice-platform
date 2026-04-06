<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-badge">O</div>
      <div>
        <div class="brand-title">OA 办公台</div>
        <div class="brand-subtitle">Office Automation Workspace</div>
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
  background: linear-gradient(180deg, #f8fffe 0%, #ecfeff 100%);
  color: #0f172a;
  border-right: 1px solid rgba(219, 228, 234, 0.9);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(13, 148, 136, 0.08);
}

.brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #14b8a6, #0f766e);
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
  color: #64748b;
}

.menu {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  color: #334155;
  border-radius: 14px;
  margin-bottom: 8px;
}

:deep(.el-menu-item.is-active) {
  color: #0f766e;
  background: rgba(13, 148, 136, 0.14);
}

@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }
}
</style>
