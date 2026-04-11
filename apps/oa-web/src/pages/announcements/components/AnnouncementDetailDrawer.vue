<!-- 复用组件：负责在公告列表、工作台等上下文中承载公告详情抽屉。 -->
<template>
  <el-drawer
    v-model="drawerVisible"
    title="公告详情"
    :size="isTabletOrDown ? '100%' : '680px'"
    append-to-body
  >
    <div v-loading="isLoading" class="drawer-stack">
      <template v-if="announcement">
        <section class="detail-panel">
          <div class="detail-meta">
            <span>发布人：{{ announcement.publishedByName }}</span>
            <span>{{ formatDateTime(announcement.publishedAt) }}</span>
          </div>

          <div class="detail-copy">
            <h3>{{ announcement.title }}</h3>
            <p v-if="announcement.summary" class="summary">{{ announcement.summary }}</p>
            <div class="content">{{ announcement.content }}</div>
          </div>
        </section>
      </template>

      <el-empty v-else-if="!isLoading" description="公告详情暂时不可用" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AnnouncementDetail } from "@/types/office-automation";
import { formatDateTime } from "@/utils/display";

const props = defineProps<{
  visible: boolean;
  announcement: AnnouncementDetail | null;
  isLoading: boolean;
  isTabletOrDown: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});
</script>

<style scoped>
.drawer-stack {
  min-height: 240px;
}

.detail-panel {
  display: grid;
  gap: 22px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.detail-copy {
  display: grid;
  gap: 16px;
}

.detail-copy h3 {
  margin: 0;
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1.18;
  letter-spacing: -0.04em;
  color: var(--app-text-primary);
}

.summary {
  margin: 0;
  color: var(--app-text-primary);
  font-size: 16px;
  line-height: 1.8;
}

.content {
  color: var(--app-text-secondary);
  line-height: 1.9;
  white-space: pre-wrap;
}
</style>
