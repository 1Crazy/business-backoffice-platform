<template>
  <div class="host-shell" :style="productConfigStore.themeVars">
    <LayoutSidebarNav
      :active-domain="currentDomain"
      :active-path="route.path"
      :groups="visibleGroups"
      @navigate="handleNavigate"
    />

    <main class="host-main">
      <header class="host-topbar">
        <nav class="host-breadcrumb" aria-label="页面路径">
          <span class="host-breadcrumb-item">{{ currentDomainTitle }}</span>
          <span class="host-breadcrumb-separator">/</span>
          <span class="host-breadcrumb-item current">{{ currentTitle }}</span>
        </nav>

        <div class="host-topbar-actions">
          <div class="host-user-summary">
            <span class="host-user-name">{{ authStore.currentUser?.displayName ?? "当前用户" }}</span>
            <span class="host-user-caption">{{ productConfigStore.runtimeConfig?.brandName ?? "当前账号" }}</span>
          </div>
          <el-button text class="host-logout-button" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <LayoutMobileNav :active-path="route.path" :groups="visibleGroups" @navigate="handleNavigate" />

      <section class="host-content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useHostNavigation } from "@/composables/useHostNavigation";
import LayoutMobileNav from "@/layout/components/LayoutMobileNav.vue";
import LayoutSidebarNav from "@/layout/components/LayoutSidebarNav.vue";
import { useAuthStore } from "@/stores/auth";
import { useProductConfigStore } from "@/stores/product-config";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const productConfigStore = useProductConfigStore();
const {
  visibleGroups,
  currentDomain,
  currentDomainTitle,
  currentTitle
} = useHostNavigation();

watch(
  () => authStore.currentUser?.tenantId,
  (tenantId) => {
    if (!tenantId) {
      productConfigStore.reset();
      return;
    }

    void productConfigStore.loadRuntimeConfig();
  },
  {
    immediate: true
  }
);

function handleNavigate(path: string): void {
  if (path !== route.path) {
    void router.push(path);
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await router.push("/login");
}
</script>

<style scoped>
.host-shell {
  --host-panel-border: rgba(15, 23, 42, 0.08);
  --host-panel-background: rgba(255, 255, 255, 0.94);
  --host-panel-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  --host-summary-border: rgba(15, 23, 42, 0.08);
  --host-summary-background: rgba(255, 255, 255, 0.9);
  --host-kicker-color: #64748b;
  --host-chip-background: color-mix(in srgb, var(--tenant-primary, #2563eb) 12%, white);
  --host-chip-color: var(--tenant-primary, #2563eb);
  --host-text-primary: var(--app-text-primary);
  --host-text-secondary: var(--app-text-secondary);
  --host-text-tertiary: var(--app-text-tertiary);
  --host-sidebar-width: 220px;
  display: grid;
  grid-template-columns: var(--host-sidebar-width) minmax(0, 1fr);
  height: var(--app-shell-min-height, 100vh);
  min-height: var(--app-shell-min-height);
  gap: 0;
  padding: 0;
  align-items: stretch;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--tenant-surface, #eff6ff) 78%, white) 0%, rgba(255, 255, 255, 0) 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--tenant-surface, #eff6ff) 32%, white) 0%, #ffffff 100%);
}

.host-main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 0;
  min-width: 0;
  min-height: 0;
  padding: var(--app-shell-gutter, 8px) 8px var(--app-shell-gutter, 8px) 0;
  overflow: hidden;
}

.host-topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  min-height: 40px;
  padding: 6px 10px;
  border-radius: 16px;
  border: 1px solid var(--host-panel-border);
  background: var(--host-panel-background);
  box-shadow: var(--host-panel-shadow);
  color: var(--host-text-primary);
  margin-bottom: 10px;
  margin-right: 0;
}

.host-breadcrumb {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.host-breadcrumb-item {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--host-text-secondary);
  white-space: nowrap;
}

.host-breadcrumb-item.current {
  color: var(--host-text-primary);
}

.host-breadcrumb-separator {
  color: var(--host-text-tertiary);
  font-size: 11px;
}

.host-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.host-user-summary {
  display: grid;
  gap: 0;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid var(--host-summary-border);
  background: var(--host-summary-background);
}

.host-user-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--host-text-primary);
}

.host-user-caption {
  display: block;
  font-size: 11px;
  color: var(--host-text-secondary);
}

.host-logout-button {
  padding-inline: 8px;
}

.host-logout-button.el-button.is-text {
  color: var(--host-text-secondary);
}

.host-logout-button.el-button.is-text:hover {
  color: var(--tenant-accent, var(--host-chip-color));
  background: var(--host-chip-background);
}

.host-content {
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  overscroll-behavior: contain;
}

.host-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

@media (max-width: 1180px) {
  .host-shell {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
    padding: var(--app-shell-gutter, 12px) 14px 14px;
  }

  :deep(.host-sidebar) {
    display: none;
  }

  .host-main {
    min-height: auto;
    grid-template-rows: auto auto auto;
    padding: 0;
    overflow: visible;
  }

  .host-topbar {
    grid-template-columns: 1fr;
    margin: 0 0 8px;
  }

  .host-topbar-actions {
    justify-content: flex-start;
  }

  .host-content {
    overflow: visible;
    padding-right: 0;
    scrollbar-gutter: auto;
  }
}

@media (max-width: 768px) {
  .host-shell {
    padding: 12px;
  }

  .host-topbar {
    padding: 5px 9px;
    margin-bottom: 8px;
  }
}
</style>
