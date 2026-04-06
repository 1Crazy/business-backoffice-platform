<!-- 工作台页面：负责组装 OA 摘要卡片、快捷入口和最近公告。 -->
<template>
  <div class="page-grid">
    <section class="hero-card page-card">
      <div>
        <p class="hero-eyebrow">Daily Command Center</p>
        <h2>今天先把待审批、公告和请假动作收拢在一个入口里。</h2>
        <p class="page-section-caption">这个工作台优先呈现和你今天最相关的办公信息，而不是把所有模块平铺出来。</p>
      </div>
      <div class="quick-actions">
        <RouterLink class="quick-link" to="/leave/request">发起请假</RouterLink>
        <RouterLink class="quick-link soft" to="/approvals/pending">处理审批</RouterLink>
      </div>
    </section>

    <section class="metric-grid">
      <article class="page-card metric-card">
        <span>待我审批</span>
        <strong>{{ overview.pendingApprovalCount }}</strong>
      </article>
      <article class="page-card metric-card">
        <span>我发起的申请</span>
        <strong>{{ overview.myRequestCount }}</strong>
      </article>
      <article class="page-card metric-card">
        <span>进行中的公告</span>
        <strong>{{ overview.activeAnnouncementCount }}</strong>
      </article>
      <article class="page-card metric-card">
        <span>通讯录部门数</span>
        <strong>{{ overview.directoryDepartmentCount }}</strong>
      </article>
    </section>

    <section class="page-card">
      <h3 class="page-section-title">最近公告</h3>
      <p class="page-section-caption">先看最新的制度变化和通知摘要，避免在审批和出勤信息里反复切换。</p>

      <div v-if="overview.recentAnnouncements.length" class="announcement-list">
        <RouterLink
          v-for="item in overview.recentAnnouncements"
          :key="item.id"
          :to="`/announcements/${item.id}`"
          class="announcement-item"
        >
          <strong>{{ item.title }}</strong>
          <p>{{ item.summary || "这条公告暂无摘要，请进入详情查看完整内容。" }}</p>
          <span>{{ item.publishedByName }} · {{ item.publishedAt }}</span>
        </RouterLink>
      </div>
      <el-empty v-else description="暂时没有需要同步的公告" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useWorkspacePage } from "@/composables/workspace/useWorkspacePage";

const { overview } = useWorkspacePage();
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.hero-eyebrow {
  margin: 0 0 10px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  max-width: 640px;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.15;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 112px;
  padding: 12px 18px;
  border-radius: 999px;
  background: #0f766e;
  color: white;
  font-weight: 700;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.quick-link.soft {
  background: #e6fffb;
  color: #0f766e;
}

.quick-link:hover {
  transform: translateY(-1px);
  opacity: 0.96;
}

.metric-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.metric-card strong {
  display: block;
  margin-top: 14px;
  font-size: 34px;
  line-height: 1;
}

.announcement-list {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.announcement-item {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.announcement-item strong {
  font-size: 16px;
}

.announcement-item p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.announcement-item span {
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 960px) {
  .hero-card {
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
