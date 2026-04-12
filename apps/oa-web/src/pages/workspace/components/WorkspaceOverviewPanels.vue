<template>
  <div class="content-grid">
    <section class="page-card focus-card">
      <div class="section-head">
        <div>
          <h3 class="page-section-title">优先事项</h3>
        </div>
      </div>

      <div class="focus-list">
        <article v-for="item in focusItems" :key="item.title" class="focus-item">
          <div class="focus-item-top">
            <strong>{{ item.title }}</strong>
            <span>{{ item.value }}</span>
          </div>
          <p>{{ item.caption }}</p>
        </article>
      </div>
    </section>

    <section class="page-card bulletin-card">
      <div class="section-head">
        <div>
          <h3 class="page-section-title">最近公告</h3>
        </div>
      </div>

      <div v-if="recentAnnouncements.length" class="announcement-list">
        <button
          v-for="item in recentAnnouncements"
          :key="item.id"
          type="button"
          class="announcement-item"
          @click="emit('open-announcement', item.id)"
        >
          <div class="announcement-top">
            <strong>{{ item.title }}</strong>
            <span>{{ formatDateTime(item.publishedAt) }}</span>
          </div>
          <p>{{ item.summary || "这条公告暂无摘要，可展开查看完整内容。" }}</p>
          <div class="announcement-foot">{{ item.publishedByName }}</div>
        </button>
      </div>
      <el-empty v-else description="暂时没有需要同步的公告" />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AnnouncementSummary } from "@/types/office-automation";
import { formatDateTime } from "@/utils/display";

interface FocusItem {
  title: string;
  value: string;
  caption: string;
}

defineProps<{
  focusItems: FocusItem[];
  recentAnnouncements: AnnouncementSummary[];
}>();

const emit = defineEmits<{
  "open-announcement": [id: string];
}>();
</script>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  min-height: 20px;
}

.focus-card,
.bulletin-card {
  display: grid;
  gap: 16px;
  align-content: start;
}

.focus-list,
.announcement-list {
  display: grid;
  gap: 12px;
  align-content: start;
  justify-items: stretch;
}

.focus-item {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(125, 148, 171, 0.12);
  background: rgba(255, 255, 255, 0.64);
}

.focus-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.focus-item strong,
.announcement-item strong {
  font-size: 15px;
}

.focus-item span,
.announcement-top span,
.announcement-foot {
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.focus-item p,
.announcement-item p {
  margin: 10px 0 0;
  color: var(--app-text-secondary);
  line-height: 1.62;
  font-size: 13px;
}

.announcement-item {
  display: grid;
  gap: 10px;
  width: 100%;
  align-content: start;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(125, 148, 171, 0.12);
  background: rgba(255, 255, 255, 0.74);
  appearance: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.announcement-item:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.18);
  box-shadow: 0 18px 30px rgba(23, 32, 43, 0.05);
}

.announcement-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 1240px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .section-head,
  .announcement-top,
  .focus-item-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
