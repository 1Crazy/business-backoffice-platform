<!-- 公告详情页面：负责展示单条公告的完整内容。 -->
<template>
  <section class="page-card detail-card" v-if="announcement">
    <div class="detail-meta">
      <span>发布人：{{ announcement.publishedByName }}</span>
      <span>{{ formatDateTime(announcement.publishedAt) }}</span>
    </div>
    <h2>{{ announcement.title }}</h2>
    <p class="summary" v-if="announcement.summary">{{ announcement.summary }}</p>
    <div class="content">{{ announcement.content }}</div>
  </section>
  <section v-else class="page-card">
    <el-empty description="公告详情暂时不可用" />
  </section>
</template>

<script setup lang="ts">
import { useAnnouncementDetailPage } from "@/composables/announcements/useAnnouncementDetailPage";
import { formatDateTime } from "@/utils/display";

const { announcement } = useAnnouncementDetailPage();
</script>

<style scoped>
.detail-card {
  padding: 28px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--app-text-tertiary);
  font-size: 12px;
}

h2 {
  margin: 16px 0 10px;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.18;
  letter-spacing: -0.04em;
}

.summary {
  margin: 0;
  color: var(--app-text-primary);
  font-size: 16px;
  line-height: 1.8;
}

.content {
  margin-top: 24px;
  color: var(--app-text-secondary);
  line-height: 1.9;
  white-space: pre-wrap;
}
</style>
