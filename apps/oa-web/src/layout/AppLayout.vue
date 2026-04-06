<!-- 布局组件：负责 OA 应用级导航、面包屑和页面壳层结构。 -->
<template>
  <div class="layout-shell">
    <LayoutSidebarNav :active-path="route.path" :items="visibleItems" />

    <main class="main">
      <header class="topbar page-card">
        <div class="topbar-copy">
          <div class="topbar-meta">
            <div class="topbar-kicker">办公协同门户</div>
            <div class="breadcrumb-row" v-if="breadcrumbItems.length > 1">
              <span v-for="item in breadcrumbItems" :key="item.key" class="breadcrumb-item">
                {{ item.title }}
              </span>
            </div>
          </div>
          <div class="title-row">
            <div class="page-title">{{ currentTitle }}</div>
            <span class="page-chip">{{ currentSectionLabel }}</span>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="user-summary">
            <span class="user-name">{{ authStore.currentUser?.displayName ?? "当前用户" }}</span>
            <span class="user-caption">统一身份账号</span>
          </div>
          <el-button text class="logout-button" @click="handleLogout">退出</el-button>
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
const currentSectionLabel = computed(() => resolveSectionLabel(route.path));

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

function resolveSectionLabel(path: string): string {
  if (path.startsWith("/approvals")) {
    return "流程协同";
  }

  if (path.startsWith("/leave")) {
    return "假勤流程";
  }

  if (path.startsWith("/announcements")) {
    return "组织信息";
  }

  if (path.startsWith("/directory")) {
    return "组织联络";
  }

  return "今日工作";
}
</script>

<style scoped>
.layout-shell {
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
  height: var(--app-shell-min-height, 100vh);
  min-height: var(--app-shell-min-height, 100vh);
  align-items: stretch;
  overflow: hidden;
}

.main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
  padding: 16px 18px 18px 0;
  min-width: 0;
  overflow: hidden;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 22px;
}

.topbar-copy {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.topbar-meta {
  display: flex;
  align-items: center;
  gap: 10px 14px;
  flex-wrap: wrap;
  min-width: 0;
}

.topbar-kicker {
  display: inline-flex;
  align-items: center;
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

.breadcrumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 160px;
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.breadcrumb-item:not(:last-child)::after {
  content: "/";
  color: rgba(124, 136, 151, 0.8);
}

.page-title {
  font-family: var(--app-font-display);
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
  border-radius: 16px;
  border: 1px solid rgba(125, 148, 171, 0.18);
  background: rgba(255, 255, 255, 0.76);
}

.user-name {
  font-weight: 700;
  color: var(--app-text-primary);
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

.content::-webkit-scrollbar {
  width: 10px;
}

.content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(125, 148, 171, 0.3);
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

  .topbar-meta {
    gap: 8px 10px;
  }

  .topbar-actions {
    flex-wrap: wrap;
  }

  .user-summary {
    flex: 1 1 auto;
  }
}
</style>
