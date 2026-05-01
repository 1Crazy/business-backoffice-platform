<template>
  <section class="micro-shell">
    <div v-if="currentError" class="state-block error-state">
      <span class="state-kicker">子应用异常</span>
      <h2>当前页面暂时无法加载</h2>
      <dl class="error-detail">
        <div>
          <dt>应用</dt>
          <dd>{{ currentMicroAppName }}</dd>
        </div>
        <div>
          <dt>入口</dt>
          <dd>{{ currentError.entry }}</dd>
        </div>
        <div>
          <dt>错误</dt>
          <dd>{{ currentError.message }}</dd>
        </div>
      </dl>
      <div class="state-actions">
        <el-button type="primary" @click="handleReload">刷新页面</el-button>
        <el-button @click="handleBackToHome">返回首页</el-button>
      </div>
    </div>

    <div v-else class="micro-stage">
      <transition name="fade">
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-card">
            <span class="state-kicker">正在接入</span>
            <strong>{{ route.meta.title ?? "业务内容" }}</strong>
            <p>主应用正在加载对应内容页，请稍候。</p>
          </div>
        </div>
      </transition>

      <div id="micro-app-slot" class="micro-slot"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { resolveFirstAccessiblePath } from "@/config/navigation";
import { useMicroRuntimeState } from "@/micro/runtime";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const microRuntimeState = useMicroRuntimeState();

const currentMicroAppName = computed(() => route.meta.microAppName);
const isLoading = computed(() => microRuntimeState.loadingAppName === currentMicroAppName.value);
const currentError = computed(() =>
  currentMicroAppName.value ? microRuntimeState.errors[currentMicroAppName.value] : undefined
);

function handleReload(): void {
  window.location.reload();
}

function handleBackToHome(): void {
  const fallbackPath = resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []);
  void router.push(fallbackPath ?? "/no-access");
}
</script>

<style scoped>
.micro-shell {
  min-height: 100%;
  height: 100%;
  min-width: 0;
}

.micro-stage {
  position: relative;
  min-height: 100%;
  height: 100%;
  min-width: 0;
}

.micro-slot {
  min-height: 100%;
  height: 100%;
  min-width: 0;
}

.micro-slot :deep([id^="__qiankun_microapp_wrapper_for_"]) {
  min-height: 0;
  height: auto;
}

.micro-slot :deep([id^="__qiankun_microapp_wrapper_for_"] > #app) {
  min-height: 0;
  height: auto;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.82) 0%, rgba(233, 242, 255, 0.68) 100%);
  backdrop-filter: blur(10px);
}

.loading-card,
.state-block {
  max-width: 520px;
  padding: 28px;
  border-radius: 28px;
  border: 1px solid rgba(59, 130, 246, 0.14);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 48px rgba(15, 41, 64, 0.08);
}

.state-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.loading-card strong,
.state-block h2 {
  display: block;
  margin-top: 14px;
  font-size: 24px;
}

.loading-card p,
.state-block p {
  margin: 10px 0 0;
  color: var(--app-text-secondary);
  line-height: 1.75;
}

.state-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.error-detail {
  display: grid;
  gap: 10px;
  margin: 16px 0 0;
}

.error-detail div {
  display: grid;
  gap: 4px;
}

.error-detail dt,
.error-detail dd {
  margin: 0;
}

.error-detail dt {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.error-detail dd {
  overflow-wrap: anywhere;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
