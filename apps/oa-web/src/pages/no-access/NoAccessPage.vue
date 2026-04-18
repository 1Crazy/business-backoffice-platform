<!-- no-access 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="no-access-shell">
    <section class="page-card no-access-card">
      <div class="eyebrow">已登录账号</div>
      <h1>账号已登录，但还没有可访问的后台页面</h1>
      <p class="description">
        当前账号已经通过身份验证，不过角色没有绑定任何页面权限，所以系统暂时无法为你打开功能页。
      </p>

      <div class="meta-grid">
        <article class="meta-item">
          <span>当前账号</span>
          <strong>{{ authStore.currentUser?.username ?? "-" }}</strong>
        </article>
        <article class="meta-item">
          <span>显示名称</span>
          <strong>{{ authStore.currentUser?.displayName ?? "-" }}</strong>
        </article>
        <article class="meta-item">
          <span>角色编码</span>
          <strong>{{ roleSummary }}</strong>
        </article>
      </div>

      <div class="page-card callout">
        <strong>建议处理方式</strong>
        <p>请让管理员为当前账号分配至少一个 OA 页面权限，例如工作台、请假申请、公告通知或组织通讯录。</p>
      </div>

      <div class="actions">
        <el-button type="primary" @click="goToLogin">返回登录页</el-button>
        <el-button @click="handleLogout">退出当前账号</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { navigateToLogin } from "@/utils/host-navigation";

const authStore = useAuthStore();
const router = useRouter();

const roleSummary = computed(() => authStore.currentUser?.roleCodes.join(", ") || "未分配角色");

async function goToLogin(): Promise<void> {
  await navigateToLogin(router);
}

async function handleLogout(): Promise<void> {
  await authStore.logout();
  await navigateToLogin(router);
}
</script>

<style scoped>
.no-access-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 36%),
    linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
}

.no-access-card {
  width: min(720px, 100%);
  padding: 32px;
}

.eyebrow {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 12px;
}

h1 {
  margin: 20px 0 14px;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.15;
  color: #0f172a;
}

.description {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  font-size: 15px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.meta-item {
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.meta-item span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.meta-item strong {
  display: block;
  margin-top: 10px;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
}

.callout {
  margin-top: 20px;
  background: linear-gradient(135deg, rgba(204, 251, 241, 0.95), rgba(255, 237, 213, 0.9));
}

.callout strong {
  display: block;
  color: #115e59;
  font-size: 16px;
}

.callout p {
  margin: 8px 0 0;
  color: #1d4ed8;
  line-height: 1.8;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 720px) {
  .no-access-card {
    padding: 24px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
