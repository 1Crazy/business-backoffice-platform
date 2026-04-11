<template>
  <div class="no-access-shell">
    <section class="page-card no-access-card">
      <span class="page-kicker">权限待配置</span>
      <h1>当前账号还没有可访问的主应用页面</h1>
      <p>主应用会自动按权限显示平台治理、OA 与 SCRM 的菜单入口。如果你已经登录但仍看到这个页面，通常意味着账号还没有被分配对应角色或页面权限。</p>
      <div class="action-row">
        <el-button type="primary" @click="handleRetry">重新检查权限</el-button>
        <el-button @click="handleLogout">退出当前账号</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import { resolveFirstAccessiblePath } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

async function handleRetry(): Promise<void> {
  await authStore.fetchProfile();
  const fallbackPath = resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []);
  await router.push(fallbackPath ?? "/no-access");
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await router.push("/login");
}
</script>

<style scoped>
.no-access-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.no-access-card {
  max-width: 680px;
}

.no-access-card h1 {
  margin: 18px 0 0;
  font-family: var(--app-font-display);
  font-size: clamp(34px, 5vw, 48px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.no-access-card p {
  margin: 16px 0 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
  font-size: 15px;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 24px;
}
</style>
