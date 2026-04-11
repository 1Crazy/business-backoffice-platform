<template>
  <aside class="host-sidebar">
    <div class="host-sidebar-inner">
      <div class="host-brand">
        <div class="host-brand-badge">{{ brandBadge }}</div>
        <div class="host-brand-copy">
          <div class="host-brand-kicker">{{ brandKicker }}</div>
          <div class="host-brand-title">{{ brandTitle }}</div>
        </div>
      </div>

      <div class="host-menu-meta">
        <span class="host-menu-label">导航目录</span>
        <span class="host-menu-count">{{ totalItemCount }}</span>
      </div>

      <el-menu ref="menuRef" :default-active="activePath" class="host-menu">
        <el-sub-menu v-for="group in groups" :key="group.key" :index="group.key">
          <template #title>
            <div class="host-submenu-title">
              <span class="host-submenu-text">{{ group.title }}</span>
            </div>
          </template>

          <el-menu-item
            v-for="item in group.items"
            :key="item.key"
            :index="item.path"
            @click="$emit('navigate', item.path)"
          >
            {{ item.title }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import type { HostDomain, HostNavigationGroup } from "@/types/navigation";

const props = defineProps<{
  activeDomain: HostDomain;
  activePath: string;
  groups: HostNavigationGroup[];
}>();

defineEmits<{
  (event: "navigate", path: string): void;
}>();

const menuRef = ref<{ open?: (index: string) => void } | null>(null);
const totalItemCount = computed(() => props.groups.reduce((total, group) => total + group.items.length, 0));

const brandBadge = computed(() => "BP");
const brandKicker = computed(() => "Business Backoffice");
const brandTitle = computed(() => "业务主系统");

watch(
  () => props.activeDomain,
  async (domain) => {
    await nextTick();
    menuRef.value?.open?.(domain);
  },
  { immediate: true }
);
</script>

<style scoped src="./LayoutSidebarNav.css"></style>
