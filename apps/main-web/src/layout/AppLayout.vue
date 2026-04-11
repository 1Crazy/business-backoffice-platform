<template>
  <div class="host-shell" :style="hostShellStyle">
    <LayoutSidebarNav
      :active-domain="currentDomain"
      :active-path="route.path"
      :groups="visibleGroups"
      @navigate="handleNavigate"
    />

    <main class="host-main">
      <header class="host-topbar">
        <div class="host-topbar-copy">
          <div class="host-topbar-kicker">{{ currentKicker }}</div>
          <div class="host-title-row">
            <div class="host-page-title">{{ currentTitle }}</div>
            <span class="host-page-chip">{{ currentSectionLabel }}</span>
          </div>
        </div>

        <div class="host-topbar-actions">
          <div class="host-user-summary">
            <span class="host-user-name">{{ authStore.currentUser?.displayName ?? "当前用户" }}</span>
            <span class="host-user-caption">统一身份账号</span>
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useHostNavigation } from "@/composables/useHostNavigation";
import LayoutMobileNav from "@/layout/components/LayoutMobileNav.vue";
import LayoutSidebarNav from "@/layout/components/LayoutSidebarNav.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const {
  visibleGroups,
  currentDomain,
  currentKicker,
  currentSectionLabel,
  currentTitle
} = useHostNavigation();
const hostShellStyle = computed(() => ({
  "--host-sidebar-width": currentDomain.value === "scrm" ? "232px" : currentDomain.value === "platform" ? "236px" : "228px"
}));

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
  --host-panel-border: rgba(114, 137, 165, 0.18);
  --host-panel-background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(244, 249, 252, 0.96) 100%);
  --host-panel-shadow: 0 20px 42px rgba(15, 30, 47, 0.08);
  --host-summary-border: rgba(114, 137, 165, 0.16);
  --host-summary-background: rgba(255, 255, 255, 0.78);
  --host-kicker-color: #0f6380;
  --host-chip-background: rgba(8, 145, 178, 0.12);
  --host-chip-color: #0f6380;
  --host-text-primary: #0f2940;
  --host-text-secondary: #496276;
  --host-text-tertiary: #72879a;
  --host-sidebar-width: 228px;
  display: grid;
  grid-template-columns: var(--host-sidebar-width) minmax(0, 1fr);
  height: var(--app-shell-min-height, 100vh);
  min-height: var(--app-shell-min-height);
  gap: 0;
  padding: 0;
  align-items: stretch;
  overflow: hidden;
}

.host-main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 0;
  min-width: 0;
  min-height: 0;
  padding: 16px 18px 18px 0;
  overflow: hidden;
}

.host-topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid var(--host-panel-border);
  background: var(--host-panel-background);
  box-shadow: var(--host-panel-shadow);
  color: var(--host-text-primary);
  margin-bottom: 16px;
}

.host-topbar-copy {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.host-topbar-kicker {
  display: inline-flex;
  align-items: center;
  color: var(--host-kicker-color);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.host-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.host-page-title {
  font-size: clamp(20px, 2.1vw, 26px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--host-text-primary);
}

.host-page-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--host-chip-background);
  color: var(--host-chip-color);
  font-size: 11px;
  font-weight: 700;
}

.host-topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.host-user-summary {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 14px;
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
  color: var(--host-text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.host-logout-button {
  padding-inline: 8px;
}

.host-logout-button.el-button.is-text {
  color: var(--host-text-secondary);
}

.host-logout-button.el-button.is-text:hover {
  color: var(--host-chip-color);
  background: var(--host-chip-background);
}

.host-content {
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

.host-content::-webkit-scrollbar {
  width: 10px;
}

.host-content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(125, 148, 171, 0.3);
}

@media (max-width: 1180px) {
  .host-shell {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
    padding: 14px 16px 16px;
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
    margin: 0 0 14px;
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
    padding: 12px 14px;
    margin-bottom: 12px;
  }

  .host-page-title {
    font-size: 28px;
  }
}
</style>
