<template>
  <div class="layout-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-badge">S</div>
        <div>
          <div class="brand-title">SCRM 控制台</div>
          <div class="brand-subtitle">Sales & Customer Ops</div>
        </div>
      </div>
      <el-menu
        :default-active="route.path"
        class="menu"
        router
      >
        <el-menu-item
          v-for="item in visibleItems"
          :key="item.path"
          :index="item.path"
        >
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </aside>

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

      <nav class="page-card mobile-nav-card mobile-nav" aria-label="快捷导航">
        <div class="mobile-nav-copy">
          <span>快捷导航</span>
          <strong>{{ currentTitle }}</strong>
        </div>
        <div class="mobile-nav-links">
          <button
            v-for="item in visibleItems"
            :key="item.path"
            type="button"
            class="mobile-nav-link"
            :class="{ active: route.path === item.path }"
            @click="handleNavigate(item.path)"
          >
            {{ item.title }}
          </button>
        </div>
      </nav>

      <section class="content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";
import { router } from "../router";

const route = useRoute();
const routerInstance = useRouter();
const authStore = useAuthStore();

const menuItems = router.getRoutes().filter(
  (item) => item.path.startsWith("/") && item.meta?.title && item.path !== "/" && item.path !== "/login"
);

const visibleItems = computed(() =>
  menuItems
    .map((item) => ({
      path: item.path,
      title: item.meta.title ?? item.name?.toString() ?? item.path,
      permission: item.meta.permission
    }))
    .filter((item) => !item.permission || authStore.hasPermission(item.permission))
);

const currentTitle = computed(() => route.meta.title ?? "SCRM 控制台");

function handleNavigate(path: string): void {
  if (path !== route.path) {
    void routerInstance.push(path);
  }
}

function handleLogout(): void {
  authStore.logout();
  void routerInstance.push("/login");
}
</script>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
}

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

.content {
  min-width: 0;
}

@media (max-width: 1024px) {
  .layout-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .main {
    padding: 16px;
  }

  .mobile-nav-card {
    display: grid;
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

  .mobile-nav-card {
    margin-bottom: 16px;
  }
}
</style>
