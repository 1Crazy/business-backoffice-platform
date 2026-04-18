<template>
  <div class="hero-stack">
    <section class="hero-card page-card">
      <div class="hero-copy">
        <span class="page-kicker">流程工作台</span>
        <h2>按模板发起。</h2>
        <div class="hero-signals">
          <span class="hero-signal">待办 {{ overview.pendingApprovalCount }}</span>
          <span class="hero-signal">申请 {{ overview.myRequestCount }}</span>
          <span class="hero-signal">公告 {{ overview.activeAnnouncementCount }}</span>
          <span class="hero-signal">部门 {{ overview.directoryDepartmentCount }}</span>
        </div>
      </div>

      <div class="hero-actions">
        <div class="hero-operations">
          <RouterLink class="hero-control primary" to="/approvals/pending">待我审批</RouterLink>
          <RouterLink class="hero-control" to="/approvals/mine">我发起的申请</RouterLink>
          <a class="hero-control workfeed-control" :href="workfeedEntryHref">统一待办入口</a>
        </div>

        <div>
          <span class="hero-actions-label">流程模板</span>
          <div v-if="templateCards.length" class="template-grid">
            <RouterLink v-for="item in templateCards" :key="item.key" class="template-link" :to="item.createRoute">
              <small>{{ item.caption }}</small>
              <strong>{{ item.label }}</strong>
            </RouterLink>
          </div>
          <p v-else class="template-empty">当前账号暂时没有可发起的流程模板。</p>
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <article v-for="item in metricCards" :key="item.label" class="page-card metric-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceOverview } from "@/types/office-automation";
import type { WorkflowTemplateDefinition } from "@/config/workflow-templates";

interface MetricCard {
  label: string;
  value: number;
}

defineProps<{
  overview: WorkspaceOverview;
  metricCards: MetricCard[];
  templateCards: WorkflowTemplateDefinition[];
  workfeedEntryHref: string;
}>();
</script>

<style scoped>
.hero-stack {
  display: grid;
  gap: 18px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}

.hero-copy {
  display: grid;
  gap: 10px;
  align-content: start;
}

h2 {
  margin: 0;
  max-width: none;
  font-size: clamp(20px, 2vw, 22px);
  line-height: 1.12;
  letter-spacing: -0.035em;
}

.hero-signals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
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
  align-content: start;
  max-width: 980px;
}

.hero-operations {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-control,
.template-link {
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(125, 148, 171, 0.16);
  background: rgba(255, 255, 255, 0.74);
  color: var(--app-text-primary);
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.hero-control {
  align-items: center;
  font-size: 13px;
  font-weight: 700;
}

.hero-control.primary {
  border-color: rgba(37, 99, 235, 0.2);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.92), rgba(239, 246, 255, 0.96));
  color: var(--app-accent-strong);
}

.workfeed-control {
  text-decoration: none;
}

.hero-actions-label {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.template-empty {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.template-link small {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.template-link strong {
  line-height: 1.35;
}

.hero-control:hover,
.template-link:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.2);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 24px rgba(23, 32, 43, 0.05);
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

@media (max-width: 1180px) {
  .hero-operations {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .template-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hero-operations,
  .template-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
