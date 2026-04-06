<!-- 工作台页面：负责组装 OA 摘要卡片、快捷入口和最近公告。 -->
<template>
  <div class="workspace-shell">
    <template v-if="isLoading">
      <section class="hero-card page-card workspace-skeleton-card">
        <div class="skeleton-stack">
          <span class="ui-skeleton ui-skeleton-pill" />
          <span class="ui-skeleton ui-skeleton-line long skeleton-heading" />
          <span class="ui-skeleton ui-skeleton-line medium" />
          <div class="skeleton-pill-row">
            <span v-for="item in 3" :key="item" class="ui-skeleton ui-skeleton-pill" />
          </div>
        </div>
        <div class="skeleton-side">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <div class="skeleton-card-block">
            <span class="ui-skeleton ui-skeleton-line short" />
            <span class="ui-skeleton ui-skeleton-line long" />
            <span class="ui-skeleton ui-skeleton-line medium" />
          </div>
        </div>
      </section>

      <section class="metric-grid">
        <article v-for="item in 4" :key="item" class="page-card metric-card metric-skeleton-card">
          <span class="ui-skeleton ui-skeleton-line short" />
          <span class="ui-skeleton ui-skeleton-line medium skeleton-metric-value" />
          <span class="ui-skeleton ui-skeleton-line long" />
        </article>
      </section>

      <div class="content-grid">
        <section class="page-card focus-card skeleton-panel">
          <div class="section-head">
            <div class="skeleton-stack">
              <span class="ui-skeleton ui-skeleton-pill" />
              <span class="ui-skeleton ui-skeleton-line medium" />
            </div>
          </div>
          <div class="focus-list">
            <article v-for="item in 3" :key="item" class="focus-item">
              <div class="focus-item-top">
                <span class="ui-skeleton ui-skeleton-line medium" />
                <span class="ui-skeleton ui-skeleton-pill" />
              </div>
              <span class="ui-skeleton ui-skeleton-line long" />
            </article>
          </div>
        </section>

        <section class="page-card bulletin-card skeleton-panel">
          <div class="section-head">
            <div class="skeleton-stack">
              <span class="ui-skeleton ui-skeleton-pill" />
              <span class="ui-skeleton ui-skeleton-line medium" />
            </div>
          </div>
          <div class="announcement-list">
            <div v-for="item in 2" :key="item" class="announcement-item announcement-skeleton-item">
              <span class="ui-skeleton ui-skeleton-line long" />
              <span class="ui-skeleton ui-skeleton-line medium" />
              <span class="ui-skeleton ui-skeleton-line short" />
            </div>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <section class="hero-card page-card">
        <div class="hero-copy">
          <span class="hero-eyebrow">办公工作台</span>
          <h2>先处理最影响今天节奏的办公事项。</h2>
          <p class="hero-caption">这个工作台优先呈现与当前员工最相关的审批、申请与组织信息，把高频动作收敛在一套更有秩序的办公门户结构里。</p>
          <div class="hero-signals">
            <span class="hero-signal">待办 {{ overview.pendingApprovalCount }}</span>
            <span class="hero-signal">申请 {{ overview.myRequestCount }}</span>
            <span class="hero-signal">公告 {{ overview.activeAnnouncementCount }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <div class="quick-actions">
            <RouterLink class="quick-link" to="/leave/request">发起请假</RouterLink>
            <RouterLink class="quick-link soft" to="/approvals/pending">处理审批</RouterLink>
          </div>
          <div class="hero-note">
            <span>统一入口</span>
            <p>审批、公告、组织联络与假勤流程都在同一条办公动线里展开。</p>
          </div>
        </div>
      </section>

      <section class="metric-grid">
        <article v-for="item in metricCards" :key="item.label" class="page-card metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.caption }}</p>
        </article>
      </section>

      <div class="content-grid">
        <section class="page-card focus-card">
          <div class="section-head">
            <div>
              <span class="page-kicker">今日优先</span>
              <h3 class="page-section-title">优先事项</h3>
            </div>
            <p class="page-section-caption">先解决最影响协作节奏的事项，再去处理次级信息。</p>
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
              <span class="page-kicker">组织动态</span>
              <h3 class="page-section-title">最近公告</h3>
            </div>
            <p class="page-section-caption">先看最新制度变化和协作提醒，避免在审批和出勤信息之间反复切换。</p>
          </div>

          <div v-if="overview.recentAnnouncements.length" class="announcement-list">
            <RouterLink
              v-for="item in overview.recentAnnouncements"
              :key="item.id"
              :to="`/announcements/${item.id}`"
              class="announcement-item"
            >
              <div class="announcement-top">
                <strong>{{ item.title }}</strong>
                <span>{{ item.publishedAt }}</span>
              </div>
              <p>{{ item.summary || "这条公告暂无摘要，请进入详情查看完整内容。" }}</p>
              <div class="announcement-foot">{{ item.publishedByName }}</div>
            </RouterLink>
          </div>
          <el-empty v-else description="暂时没有需要同步的公告" />
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useWorkspacePage } from "@/composables/workspace/useWorkspacePage";

const { overview, isLoading } = useWorkspacePage();

const metricCards = computed(() => [
  {
    label: "待我审批",
    value: overview.value.pendingApprovalCount,
    caption: "优先处理当前轮到你的审批节点。"
  },
  {
    label: "我发起的申请",
    value: overview.value.myRequestCount,
    caption: "持续跟踪自己提交过的办公申请。"
  },
  {
    label: "进行中的公告",
    value: overview.value.activeAnnouncementCount,
    caption: "把制度变化与协作提醒保持在视线内。"
  },
  {
    label: "通讯录部门数",
    value: overview.value.directoryDepartmentCount,
    caption: "组织信息已按部门结构沉淀到同一入口。"
  }
]);

const focusItems = computed(() => [
  {
    title: "待我审批",
    value: `${overview.value.pendingApprovalCount} 项`,
    caption:
      overview.value.pendingApprovalCount > 0 ? "建议先清理当前卡在你这里的审批动作，避免影响上下游协作。" : "当前没有积压在你这里的审批事项。"
  },
  {
    title: "我发起的申请",
    value: `${overview.value.myRequestCount} 项`,
    caption:
      overview.value.myRequestCount > 0 ? "最近申请仍在流转中，适合从这里继续查看最新状态与审批意见。" : "当前没有需要继续跟进的个人申请。"
  },
  {
    title: "公告同步",
    value: `${overview.value.activeAnnouncementCount} 条`,
    caption:
      overview.value.activeAnnouncementCount > 0 ? "先浏览最新制度与通知摘要，避免在后续协作中出现信息差。" : "当前公告节奏平稳，可以把时间优先留给流程处理。"
  }
]);
</script>

<style scoped>
.workspace-shell {
  display: grid;
  gap: 18px;
}

.workspace-skeleton-card,
.skeleton-panel,
.metric-skeleton-card {
  overflow: hidden;
}

.skeleton-stack,
.skeleton-side,
.skeleton-card-block {
  display: grid;
  gap: 12px;
}

.skeleton-side {
  align-content: start;
}

.skeleton-heading {
  height: 34px;
  border-radius: 18px;
}

.skeleton-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.skeleton-metric-value {
  height: 28px;
  width: 44%;
  border-radius: 14px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.55fr);
  gap: 20px;
  align-items: stretch;
}

.hero-eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  max-width: none;
  font-size: clamp(24px, 2.5vw, 30px);
  line-height: 1.18;
  letter-spacing: -0.035em;
}

.hero-caption {
  max-width: 42rem;
  margin: 10px 0 0;
  color: var(--app-text-secondary);
  font-size: 14px;
  line-height: 1.68;
}

.hero-signals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.hero-signal {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(125, 148, 171, 0.12);
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.hero-actions {
  display: grid;
  gap: 14px;
  align-content: space-between;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 112px;
  padding: 12px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--app-accent) 0%, var(--app-accent-strong) 100%);
  color: white;
  font-weight: 700;
  box-shadow: 0 18px 32px rgba(15, 118, 110, 0.18);
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

.quick-link.soft {
  background: rgba(255, 255, 255, 0.86);
  color: var(--app-accent-strong);
  box-shadow: none;
}

.quick-link:hover {
  transform: translateY(-1px);
  opacity: 0.98;
}

.hero-note {
  padding: 16px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(198, 123, 51, 0.12), transparent 70%),
    rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(125, 148, 171, 0.12);
}

.hero-note span {
  display: block;
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-note p {
  margin: 8px 0 0;
  color: var(--app-text-secondary);
  line-height: 1.65;
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  display: grid;
  gap: 8px;
  align-content: start;
}

.metric-card span {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.metric-card strong {
  font-size: clamp(28px, 3vw, 34px);
  line-height: 1;
}

.metric-card p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.62;
  font-size: 13px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-head .page-section-caption {
  max-width: 320px;
  margin: 0;
}

.focus-card,
.bulletin-card {
  display: grid;
  gap: 16px;
}

.focus-list,
.announcement-list {
  display: grid;
  gap: 12px;
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
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(125, 148, 171, 0.12);
  background: rgba(255, 255, 255, 0.74);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.announcement-item:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 118, 110, 0.18);
  box-shadow: 0 18px 30px rgba(23, 32, 43, 0.05);
}

.announcement-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.announcement-skeleton-item {
  pointer-events: none;
}

@media (max-width: 1080px) {
  .hero-card,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .announcement-top,
  .focus-item-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-card {
    gap: 16px;
  }
}
</style>
