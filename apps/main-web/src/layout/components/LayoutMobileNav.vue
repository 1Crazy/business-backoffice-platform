<template>
  <div class="mobile-nav">
    <button type="button" class="toggle-button" @click="expanded = true">
      <Menu class="toggle-icon" />
      <span>全部菜单</span>
    </button>

    <teleport to="body">
      <div v-if="expanded" class="drawer-mask" @click="expanded = false">
        <aside class="drawer-panel" @click.stop>
          <header class="drawer-head">
            <div>
              <strong>主应用菜单</strong>
              <span>统一浏览全部业务入口，不再区分来源子系统。</span>
            </div>
            <button type="button" class="close-button" @click="expanded = false">
              <Close class="close-icon" />
            </button>
          </header>

          <div class="drawer-content">
            <section v-for="group in groups" :key="group.key" class="drawer-group">
              <div class="drawer-group-title">{{ group.title }}</div>
              <button
                v-for="item in group.items"
                :key="item.key"
                type="button"
                class="drawer-item"
                :class="{ 'drawer-item-active': activePath === item.path }"
                @click="handleNavigate(item.path)"
              >
                <strong>{{ item.title }}</strong>
                <small>{{ item.description }}</small>
              </button>
            </section>
          </div>
        </aside>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { Close, Menu } from "@element-plus/icons-vue";
import { ref } from "vue";

import type { HostNavigationGroup } from "@/types/navigation";

const props = defineProps<{
  activePath: string;
  groups: HostNavigationGroup[];
}>();

const emit = defineEmits<{
  (event: "navigate", path: string): void;
}>();

const expanded = ref(false);

function handleNavigate(path: string): void {
  expanded.value = false;
  emit("navigate", path);
}
</script>

<style scoped>
.mobile-nav {
  display: none;
}

.toggle-button,
.close-button,
.drawer-item {
  cursor: pointer;
}

.toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid rgba(8, 145, 178, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--app-text-primary);
}

.toggle-icon,
.close-icon {
  width: 18px;
  height: 18px;
}

.drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  justify-items: end;
  background: rgba(15, 41, 64, 0.24);
  backdrop-filter: blur(8px);
}

.drawer-panel {
  width: min(92vw, 360px);
  height: 100%;
  padding: 22px 18px;
  background: rgba(252, 255, 255, 0.96);
  box-shadow: -24px 0 48px rgba(15, 41, 64, 0.12);
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.drawer-head strong,
.drawer-head span {
  display: block;
}

.drawer-head span {
  margin-top: 6px;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.close-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 14px;
  background: rgba(15, 41, 64, 0.06);
}

.drawer-content {
  display: grid;
  gap: 18px;
  height: calc(100% - 72px);
  overflow-y: auto;
}

.drawer-group {
  display: grid;
  gap: 10px;
}

.drawer-group-title {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.drawer-item {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  text-align: left;
}

.drawer-item strong,
.drawer-item small {
  display: block;
}

.drawer-item small {
  margin-top: 4px;
  color: var(--app-text-secondary);
  line-height: 1.55;
}

.drawer-item-active {
  border-color: rgba(8, 145, 178, 0.18);
  background: rgba(236, 254, 255, 0.92);
}

@media (max-width: 1180px) {
  .mobile-nav {
    display: block;
  }
}
</style>
