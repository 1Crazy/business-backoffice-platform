<!-- 布局组件：负责应用级导航与壳层结构，具体业务内容通过路由视图承载。 -->
<template>
  <div class="layout-shell" :class="{ 'layout-shell-embedded': microAppMode }">
    <LayoutSidebarNav v-if="!microAppMode" :active-path="route.path" :items="visibleItems" />

    <main class="main" :class="{ 'main-embedded': microAppMode }">
      <header v-if="!microAppMode" class="topbar page-card">
        <div class="topbar-copy">
          <div class="topbar-kicker">{{ currentKicker }}</div>
          <div class="title-row">
            <div class="page-title">{{ currentTitle }}</div>
            <span class="page-chip">{{ currentSectionLabel }}</span>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="user-summary">
            <span class="user-name">{{ authStore.currentUser?.displayName ?? "系统管理员" }}</span>
            <span class="user-caption">运营控制台账号</span>
          </div>
          <el-button text class="logout-button" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <LayoutMobileNav
        v-if="!microAppMode"
        :active-path="route.path"
        :current-title="currentTitle"
        :items="visibleItems"
        @navigate="handleNavigate"
      />

      <section class="content" :class="{ 'content-embedded': microAppMode }">
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
import { isMicroAppMode } from "@/micro/runtime";
import { router } from "@/router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const routerInstance = useRouter();
const authStore = useAuthStore();
const microAppMode = isMicroAppMode();

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
const currentSectionLabel = computed(() => resolveSectionLabel(route.path));
const currentKicker = computed(() => resolveKicker(route.path));

function handleNavigate(path: string): void {
  if (path !== route.path) {
    void routerInstance.push(path);
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await routerInstance.push("/login");
}

function resolveSectionLabel(path: string): string {
  if (path.startsWith("/customers")) {
    return "客户运营";
  }

  if (path.startsWith("/opportunities")) {
    return "销售商机";
  }

  if (path.startsWith("/leads")) {
    return "线索跟进";
  }

  if (path.startsWith("/departments")) {
    return "权限治理";
  }

  if (path.startsWith("/system")) {
    return "平台设置";
  }

  return "运营总览";
}

function resolveKicker(path: string): string {
  if (path.startsWith("/customers")) {
    return "客户经营";
  }

  if (path.startsWith("/opportunities")) {
    return "销售管道";
  }

  if (path.startsWith("/leads")) {
    return "线索漏斗";
  }

  if (path.startsWith("/departments")) {
    return "权限治理";
  }

  if (path.startsWith("/system")) {
    return "平台管理";
  }

  return "销售运营";
}
</script>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  height: var(--app-shell-min-height, 100vh);
  min-height: var(--app-shell-min-height, 100vh);
  align-items: stretch;
  overflow: hidden;
}

.layout-shell-embedded {
  display: block;
  min-height: 0;
  height: auto;
  overflow: visible;
}

.main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
  padding: 16px 18px 18px 0;
  min-width: 0;
  overflow: hidden;
}

.main-embedded {
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
  padding: 0;
  overflow: visible;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 20px;
}

.topbar-copy {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.topbar-kicker {
  display: inline-flex;
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.page-title {
  font-size: clamp(20px, 2.1vw, 26px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--app-text-primary);
}

.page-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.user-summary {
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(95, 125, 170, 0.16);
  background: rgba(255, 255, 255, 0.86);
}

.user-name {
  font-weight: 700;
  font-size: 13px;
}

.user-caption {
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.logout-button {
  padding-inline: 8px;
}

.content {
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

.content-embedded {
  overflow: visible;
  padding-right: 0;
}

.content::-webkit-scrollbar {
  width: 10px;
}

.content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(95, 125, 170, 0.3);
}

@media (max-width: 1024px) {
  .layout-shell {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .main {
    min-height: auto;
    grid-template-rows: auto auto auto;
    padding: 14px 16px 16px;
    overflow: visible;
  }

  .topbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .topbar-actions {
    justify-content: space-between;
  }

  .content {
    overflow: visible;
    padding-right: 0;
    scrollbar-gutter: auto;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 12px;
  }

  .topbar {
    padding: 12px 14px;
    margin-bottom: 12px;
  }

  .topbar-actions {
    flex-wrap: wrap;
  }

  .user-summary {
    flex: 1 1 auto;
  }
}
</style>
