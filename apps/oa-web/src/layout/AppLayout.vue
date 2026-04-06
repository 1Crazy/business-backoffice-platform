<!-- 布局组件：负责 OA 应用级导航、面包屑和页面壳层结构。 -->
<template>
  <div class="layout-shell">
    <LayoutSidebarNav :active-path="route.path" :items="visibleItems" />

    <main class="main">
      <header class="topbar">
        <div class="topbar-copy">
          <div class="breadcrumb-row" v-if="breadcrumbItems.length > 1">
            <span v-for="item in breadcrumbItems" :key="item.key" class="breadcrumb-item">
              {{ item.title }}
            </span>
          </div>
          <div class="page-title">{{ currentTitle }}</div>
          <div class="page-caption">围绕审批、公告与组织协作构建的一期 OA 工作台。</div>
        </div>
        <div class="topbar-actions">
          <div class="user-summary">
            <span class="user-name">{{ authStore.currentUser?.displayName }}</span>
            <span class="user-caption">Unified Employee Identity</span>
          </div>
          <el-button text @click="handleLogout">退出登录</el-button>
        </div>
      </header>

      <LayoutMobileNav :active-path="route.path" :current-title="currentTitle" :items="visibleItems" @navigate="handleNavigate" />

      <section class="content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import LayoutMobileNav from "@/layout/components/LayoutMobileNav.vue";
import LayoutSidebarNav from "@/layout/components/LayoutSidebarNav.vue";
import { router } from "@/router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const routerInstance = useRouter();
const authStore = useAuthStore();

const menuItems = router.getRoutes().filter(
  (item) =>
    item.path.startsWith("/") &&
    item.meta?.title &&
    item.path !== "/" &&
    item.path !== "/login" &&
    !item.meta?.hidden
);

const visibleItems = computed(() =>
  menuItems
    .map((item) => ({
      path: item.path,
      title: item.meta.title ?? item.name?.toString() ?? item.path,
      permission: item.meta.permission
    }))
    .filter((item) => !item.permission || authStore.hasPermission(item.permission))
    .map((item) => ({
      path: item.path,
      title: item.title
    }))
);

const breadcrumbItems = computed(() =>
  route.matched
    .filter((item) => item.meta?.title && item.path !== "/")
    .map((item, index) => ({
      key: `${item.path}-${index}`,
      title: item.meta.title?.toString() ?? item.name?.toString() ?? item.path
    }))
);

const currentTitle = computed(() => route.meta.title?.toString() ?? "OA 办公台");

function handleNavigate(path: string): void {
  if (path !== route.path) {
    void routerInstance.push(path);
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await routerInstance.push("/login");
}

defineExpose({
  handleNavigate
});
</script>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  min-height: 100vh;
}

.main {
  padding: 20px;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.topbar-copy {
  min-width: 0;
}

.breadcrumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.breadcrumb-item:not(:last-child)::after {
  content: "/";
  color: #94a3b8;
}

.page-title {
  font-size: clamp(24px, 3vw, 30px);
  font-weight: 700;
  color: #0f172a;
}

.page-caption {
  margin-top: 6px;
  color: #64748b;
  line-height: 1.7;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(219, 228, 234, 0.9);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.user-summary {
  display: grid;
  gap: 2px;
}

.user-name {
  font-weight: 700;
}

.user-caption {
  color: #64748b;
  font-size: 12px;
}

.content {
  min-width: 0;
}

@media (max-width: 1024px) {
  .layout-shell {
    grid-template-columns: 1fr;
  }

  .main {
    padding: 16px;
  }

  .user-caption {
    display: none;
  }
}

@media (max-width: 640px) {
  .topbar {
    gap: 14px;
    margin-bottom: 16px;
  }

  .topbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
