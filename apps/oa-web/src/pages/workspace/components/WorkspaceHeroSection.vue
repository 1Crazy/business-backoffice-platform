<template>
  <div class="hero-stack">
    <section class="hero-card page-card">
      <div class="hero-copy">
        <h2>先处理待办。</h2>
        <div class="hero-signals">
          <span class="hero-signal">待办 {{ overview.pendingApprovalCount }}</span>
          <span class="hero-signal">申请 {{ overview.myRequestCount }}</span>
          <span class="hero-signal">行政待审 {{ overview.administrativeRequestPendingCount }}</span>
          <span class="hero-signal">我的行政 {{ overview.administrativeRequestMyCount }}</span>
        </div>
      </div>
      <div class="hero-actions">
        <span class="hero-actions-label">快捷处理</span>
        <div class="quick-actions">
          <RouterLink
            v-for="item in quickActions"
            :key="item.label"
            :class="['quick-link', { 'primary-action': item.isPrimary, soft: item.tone === 'soft' }]"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>
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
import type { RouteLocationRaw } from "vue-router";
import type { WorkspaceOverview } from "@/types/office-automation";

interface MetricCard { label: string; value: number; }
interface QuickAction { label: string; to: RouteLocationRaw; isPrimary?: boolean; tone?: "soft"; }
defineProps<{ overview: WorkspaceOverview; metricCards: MetricCard[] }>();

const quickActions: QuickAction[] = [
  {
    label: "立即处理待办",
    to: "/administrative-requests/pending",
    isPrimary: true
  },
  {
    label: "报销申请",
    to: {
      path: "/administrative-requests/new",
      query: {
        type: "REIMBURSEMENT"
      }
    }
  },
  {
    label: "出差申请",
    to: {
      path: "/administrative-requests/new",
      query: {
        type: "TRAVEL"
      }
    }
  },
  {
    label: "采购申请",
    to: {
      path: "/administrative-requests/new",
      query: {
        type: "PURCHASE"
      }
    }
  },
  {
    label: "用印申请",
    to: {
      path: "/administrative-requests/new",
      query: {
        type: "SEAL"
      }
    }
  },
  {
    label: "我的行政申请",
    to: "/administrative-requests/mine",
    tone: "soft"
  }
];
</script>

<style scoped>
.hero-stack {
  display: grid;
  gap: 18px;
}
.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
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
  gap: 10px;
  align-content: start;
  max-width: 980px;
}
.hero-actions-label {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.quick-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 12px 14px;
  line-height: 1.2;
  border-radius: 14px;
  border: 1px solid rgba(125, 148, 171, 0.16);
  background: rgba(255, 255, 255, 0.74);
  color: var(--app-text-primary);
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}
.primary-action {
  border-color: rgba(37, 99, 235, 0.2);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.92), rgba(239, 246, 255, 0.96));
  color: var(--app-accent-strong);
  font-weight: 700;
}
.quick-link.soft {
  color: var(--app-text-secondary);
}
.quick-link:hover {
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
@media (max-width: 1080px) {
  .quick-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .quick-actions,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    gap: 16px;
  }
}
</style>
