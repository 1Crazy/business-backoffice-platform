<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <div class="brand-block">
        <div class="brand-mark">H</div>
        <div class="brand-copy">
          <div class="brand-kicker">统一门户</div>
          <strong>主应用工作台</strong>
        </div>
      </div>

      <div class="menu-meta">
        <span class="menu-label">导航目录</span>
        <span class="menu-count">{{ totalItemCount }}</span>
      </div>

      <nav class="nav-list" aria-label="主应用导航">
        <section v-for="group in props.groups" :key="group.key" class="group-block">
          <header class="group-head">
            <div class="group-label">
              <strong>{{ group.title }}</strong>
              <span>{{ group.caption }}</span>
            </div>
            <div class="group-badge">{{ group.items.length }}</div>
          </header>

          <button
            v-for="item in group.items"
            :key="item.key"
            type="button"
            class="nav-item"
            :class="{ 'nav-item-active': props.activePath === item.path }"
            :aria-current="props.activePath === item.path ? 'page' : undefined"
            @click="$emit('navigate', item.path)"
          >
            <span class="nav-icon-shell">
              <component :is="resolveItemIcon(item.icon)" class="nav-icon" />
            </span>
            <span class="nav-copy">
              <strong>{{ item.title }}</strong>
              <small>{{ item.sectionLabel }}</small>
            </span>
          </button>
        </section>
      </nav>

      <div class="sidebar-footer">
        <span class="sidebar-footer-title">当前入口</span>
        <strong class="sidebar-footer-heading">{{ activeItem?.title ?? "统一工作台" }}</strong>
        <span class="sidebar-footer-caption">
          {{ activeItem?.description ?? "主系统统一承接所有业务入口，不再区分来源子系统。" }}
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Bell, Calendar, Check, Compass, Connection, DataBoard, Files, Management, Opportunity, Setting, Tickets, User } from "@element-plus/icons-vue";

import type { HostNavigationGroup, NavigationIcon } from "@/types/navigation";

const props = defineProps<{
  activePath: string;
  groups: HostNavigationGroup[];
}>();

defineEmits<{
  (event: "navigate", path: string): void;
}>();

const itemIconMap: Record<NavigationIcon, typeof Compass> = {
  compass: Compass,
  checklist: Check,
  draft: Files,
  calendar: Calendar,
  announcement: Bell,
  directory: Connection,
  dashboard: DataBoard,
  department: Tickets,
  customer: User,
  opportunity: Opportunity,
  lead: Management,
  system: Setting
};

const totalItemCount = computed(() => props.groups.reduce((total, group) => total + group.items.length, 0));
const activeItem = computed(() =>
  props.groups.flatMap((group) => group.items).find((item) => item.path === props.activePath)
);

function resolveItemIcon(icon: NavigationIcon) {
  return itemIconMap[icon];
}
</script>

<style scoped src="./LayoutSidebarNav.css"></style>
