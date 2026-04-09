<template>
  <div class="layout-shell">
    <LayoutSidebarNav :active-path="route.path" :groups="visibleGroups" @navigate="handleNavigate" />

    <main class="main">
      <header class="topbar page-card">
        <div class="topbar-copy">
          <div class="topbar-kicker">{{ currentKicker }}</div>
          <div class="title-row">
            <h1 class="page-title">{{ currentTitle }}</h1>
            <span class="page-chip">{{ currentSectionLabel }}</span>
          </div>
          <p class="page-description">{{ currentDescription }}</p>
        </div>

        <div class="topbar-actions">
          <div class="user-summary">
            <span class="user-name">{{ authStore.currentUser?.displayName ?? "当前用户" }}</span>
            <span class="user-caption">统一身份账号</span>
          </div>
          <el-button text class="logout-button" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <LayoutMobileNav :active-path="route.path" :groups="visibleGroups" @navigate="handleNavigate" />

      <section class="content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
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
  currentDescription,
  currentKicker,
  currentSectionLabel,
  currentTitle
} = useHostNavigation();

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
.layout-shell {
  display: grid;
  grid-template-columns: 292px minmax(0, 1fr);
  min-height: var(--app-shell-min-height);
  gap: 16px;
  padding: 16px;
}

.main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
  min-height: 0;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}

.topbar-copy {
  min-width: 0;
  display: grid;
  gap: 10px;
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
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(28px, 2.6vw, 38px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.page-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(8, 145, 178, 0.08);
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
}

.page-description {
  margin: 0;
  max-width: 760px;
  color: var(--app-text-secondary);
  line-height: 1.75;
  font-size: 14px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-summary {
  padding: 10px 14px;
  border-radius: 18px;
  border: 1px solid rgba(8, 145, 178, 0.14);
  background: rgba(255, 255, 255, 0.76);
}
.user-caption,
.user-caption {
  display: block;
  color: var(--app-text-tertiary);
  font-size: 11px;
}

.user-name {
  display: block;
  margin-top: 4px;
  font-size: 13px;
}

.logout-button {
  padding-inline: 8px;
}

.content {
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1180px) {
  .layout-shell {
    grid-template-columns: 1fr;
  }

  :deep(.sidebar) {
    display: none;
  }

  .topbar {
    grid-template-columns: 1fr;
  }

  .topbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .layout-shell {
    padding: 14px;
  }

  .page-title {
    font-size: 28px;
  }
}
</style>
