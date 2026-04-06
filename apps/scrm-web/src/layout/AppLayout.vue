<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <div class="layout-shell">
    <LayoutSidebarNav :active-path="route.path" :items="visibleItems" />

    <main class="main">
      <header class="topbar">
        <div class="topbar-copy">
          <div class="page-title">{{ currentTitle }}</div>
          <div class="page-caption">聚焦客户与销售运营的一期 SCRM MVP</div>
        </div>
        <div class="topbar-actions">
          <span class="user-name">{{ authStore.currentUser?.displayName }}</span>
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
    !item.meta?.hideInMenu
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

const currentTitle = computed(() => route.meta.title?.toString() ?? "SCRM 控制台");

function handleNavigate(path: string): void {
  if (path !== route.path) {
    void routerInstance.push(path);
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await routerInstance.push("/login");
}
</script>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
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

.page-title {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 700;
  color: #0f172a;
}

.page-caption {
  margin-top: 6px;
  color: #64748b;
  line-height: 1.6;
}

.topbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.user-name {
  font-weight: 600;
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

  .user-name {
    display: none;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 14px;
  }

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
