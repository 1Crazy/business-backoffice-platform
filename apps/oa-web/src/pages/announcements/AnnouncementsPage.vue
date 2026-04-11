<!-- 公告列表页面：负责组装公告列表并跳转到详情。 -->
<template>
  <section class="page-card page-shell">
    <div class="section-head">
      <div>
        <span class="page-kicker">组织动态</span>
        <h2 class="page-section-title">公告通知</h2>
      </div>
      <p class="page-section-caption">最近发布。</p>
    </div>

    <div v-if="announcements.length" class="announcement-list">
      <RouterLink v-for="item in announcements" :key="item.id" :to="`/announcements/${item.id}`" class="announcement-item">
        <div class="announcement-head">
          <strong>{{ item.title }}</strong>
          <span>{{ formatDateTime(item.publishedAt) }}</span>
        </div>
        <p>{{ item.summary || "这条公告没有摘要，请进入详情页查看完整内容。" }}</p>
        <div class="announcement-foot">发布人：{{ item.publishedByName }}</div>
      </RouterLink>
    </div>
    <el-empty v-else description="暂时没有公告可查看" />
  </section>
</template>

<script setup lang="ts">
import { useAnnouncementsPage } from "@/composables/announcements/useAnnouncementsPage";
import { formatDateTime } from "@/utils/display";

const { announcements } = useAnnouncementsPage();
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-head .page-section-caption {
  max-width: 420px;
  margin: 0;
}

.announcement-list {
  display: grid;
  gap: 14px;
}

.announcement-item {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(125, 148, 171, 0.14);
  background: rgba(255, 255, 255, 0.74);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.announcement-item:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.18);
  box-shadow: 0 18px 30px rgba(23, 32, 43, 0.05);
}

.announcement-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.announcement-head span,
.announcement-foot {
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.announcement-item p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .section-head,
  .announcement-head {
    flex-direction: column;
  }
}
</style>
