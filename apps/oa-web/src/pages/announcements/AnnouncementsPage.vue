<!-- 公告列表页面：负责组装公告列表并跳转到详情。 -->
<template>
  <section class="page-card">
    <h2 class="page-section-title">公告通知</h2>
    <p class="page-section-caption">把制度更新、节奏提醒和协作通知收拢到一个可快速浏览的列表里。</p>

    <div v-if="announcements.length" class="announcement-list">
      <RouterLink v-for="item in announcements" :key="item.id" :to="`/announcements/${item.id}`" class="announcement-item">
        <div class="announcement-head">
          <strong>{{ item.title }}</strong>
          <span>{{ item.publishedAt }}</span>
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

const { announcements } = useAnnouncementsPage();
</script>

<style scoped>
.announcement-list {
  display: grid;
  gap: 14px;
}

.announcement-item {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.announcement-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.announcement-head span,
.announcement-foot {
  color: #64748b;
  font-size: 12px;
}

.announcement-item p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .announcement-head {
    flex-direction: column;
  }
}
</style>
