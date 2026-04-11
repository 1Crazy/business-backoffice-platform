<template>
  <div class="host-mobile-nav">
    <button type="button" class="host-mobile-toggle-button" @click="expanded = true">
      <Menu class="host-mobile-toggle-icon" />
      <span>全部菜单</span>
    </button>

    <teleport to="body">
      <div v-if="expanded" class="host-mobile-drawer-mask" @click="expanded = false">
        <aside class="host-mobile-drawer-panel" @click.stop>
          <header class="host-mobile-drawer-head">
            <div>
              <strong>{{ drawerTitle }}</strong>
              <span v-if="drawerCaption">{{ drawerCaption }}</span>
            </div>
            <button type="button" class="host-mobile-close-button" @click="expanded = false">
              <Close class="host-mobile-close-icon" />
            </button>
          </header>

          <div class="host-mobile-drawer-content">
            <section v-for="group in groups" :key="group.key" class="host-mobile-drawer-group">
              <div class="host-mobile-drawer-group-title">{{ group.title }}</div>
              <button
                v-for="item in group.items"
                :key="item.key"
                type="button"
                class="host-mobile-drawer-item"
                :class="{ 'host-mobile-drawer-item-active': activePath === item.path }"
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
import { computed, ref } from "vue";

import type { HostNavigationGroup } from "@/types/navigation";

const props = defineProps<{
  activePath: string;
  groups: HostNavigationGroup[];
}>();

const emit = defineEmits<{
  (event: "navigate", path: string): void;
}>();

const expanded = ref(false);
const drawerTitle = computed(() => "业务主系统");
const drawerCaption = computed(() => "");

function handleNavigate(path: string): void {
  expanded.value = false;
  emit("navigate", path);
}
</script>

<style scoped>
.host-mobile-nav {
  display: none;
}

.host-mobile-toggle-button,
.host-mobile-close-button,
.host-mobile-drawer-item {
  cursor: pointer;
}

.host-mobile-toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--app-text-primary);
}

.host-mobile-toggle-icon,
.host-mobile-close-icon {
  width: 18px;
  height: 18px;
}

.host-mobile-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  justify-items: end;
  background: rgba(18, 32, 47, 0.22);
  backdrop-filter: blur(8px);
}

.host-mobile-drawer-panel {
  width: min(92vw, 360px);
  height: 100%;
  padding: 22px 18px;
  color: rgba(255, 255, 255, 0.96);
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 24%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.22), transparent 28%),
    linear-gradient(180deg, #0f172a 0%, #0f1b34 48%, #12203d 100%);
  box-shadow: -24px 0 48px rgba(2, 6, 23, 0.28);
}

.host-mobile-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.host-mobile-drawer-head strong,
.host-mobile-drawer-head span {
  display: block;
}

.host-mobile-drawer-head span {
  margin-top: 6px;
  color: #c5d2e8;
  font-size: 12px;
  line-height: 1.6;
}

.host-mobile-close-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 14px;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
}

.host-mobile-drawer-content {
  display: grid;
  gap: 18px;
  height: calc(100% - 72px);
  overflow-y: auto;
}

.host-mobile-drawer-group {
  display: grid;
  gap: 10px;
}

.host-mobile-drawer-group-title {
  color: #7f93b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.host-mobile-drawer-item {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 18px;
  color: inherit;
  background: rgba(255, 255, 255, 0.06);
  text-align: left;
}

.host-mobile-drawer-item strong,
.host-mobile-drawer-item small {
  display: block;
}

.host-mobile-drawer-item small {
  margin-top: 4px;
  color: #c5d2e8;
  line-height: 1.55;
}

.host-mobile-drawer-item-active {
  border-color: rgba(147, 197, 253, 0.2);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.44), rgba(29, 78, 216, 0.32));
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.2);
}

@media (max-width: 1180px) {
  .host-mobile-nav {
    display: block;
  }
}
</style>
