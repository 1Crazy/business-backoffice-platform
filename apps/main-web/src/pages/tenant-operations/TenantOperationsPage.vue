<template>
  <div class="tenant-page">
    <section class="page-card tenant-hero">
      <div class="tenant-hero-copy">
        <span class="page-kicker" v-once>平台运营</span>
        <div class="tenant-hero-heading">
          <h1>租户生命周期、配额与运行状态</h1>
          <p>
            把租户开通、配额压力、任务异常和最近活跃统一收口到一个运营视图里，避免平台治理信息分散在多个页面之间。
          </p>
        </div>

        <div class="tenant-hero-pills">
          <span class="tenant-hero-pill">租户清单与抽屉联动</span>
          <span class="tenant-hero-pill">配额快照与异常并排查看</span>
          <span class="tenant-hero-pill">生命周期动作直接收口</span>
        </div>
      </div>

      <div class="tenant-hero-panel">
        <div class="tenant-hero-metric">
          <span>当前视图</span>
          <strong>{{ visibleTenants.length }}</strong>
          <p>{{ visibleTenants.length === tenants.length ? "全部租户" : "筛选结果" }}</p>
        </div>

        <div class="tenant-hero-divider" />

        <div class="tenant-hero-focus">
          <span>当前焦点</span>
          <strong>{{ selectedTenant?.name ?? "未选择租户" }}</strong>
          <p>{{ selectedTenant?.ownerName ?? "选择一条租户记录后查看详情" }}</p>
        </div>

        <el-button type="primary" @click="openCreateDialog">新建租户</el-button>
      </div>
    </section>

    <section class="tenant-summary-grid">
      <article
        v-for="item in summaryItems"
        :key="item.label"
        class="page-card tenant-summary-card"
        :data-tone="item.tone"
      >
        <span class="tenant-summary-label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ formatSummaryCaption(item.label) }}</p>
      </article>
    </section>

    <section class="page-card tenant-shell">
      <div class="tenant-toolbar">
        <div class="tenant-toolbar-search">
          <span class="tenant-toolbar-label">租户检索</span>
          <el-input v-model="keyword" placeholder="搜索租户名称、编码、负责人或邮箱" clearable />
        </div>

        <div class="tenant-toolbar-filters">
          <div class="tenant-toolbar-filter">
            <span class="tenant-toolbar-label">生命周期</span>
            <el-select v-model="lifecycleFilter" clearable placeholder="全部状态">
              <el-option
                v-for="item in lifecycleOptions"
                :key="item"
                :label="formatLifecycleStatus(item)"
                :value="item"
              />
            </el-select>
          </div>

          <div class="tenant-toolbar-filter">
            <span class="tenant-toolbar-label">运行状态</span>
            <el-select v-model="runtimeFilter" clearable placeholder="全部状态">
              <el-option
                v-for="item in runtimeOptions"
                :key="item"
                :label="formatRuntimeStatus(item)"
                :value="item"
              />
            </el-select>
          </div>
        </div>
      </div>

      <div class="tenant-content">
        <section class="tenant-list-panel">
          <div class="tenant-panel-head">
            <div>
              <span class="page-kicker">租户台账</span>
              <h2 class="page-section-title">租户清单</h2>
              <p class="page-section-caption">
                点击任意租户，在抽屉中查看运营详情；当前共匹配 {{ visibleTenants.length }} 条记录。
              </p>
            </div>
          </div>

          <template v-if="isLoading">
            <div class="tenant-loading">
              <span v-for="item in 5" :key="item" class="ui-skeleton ui-skeleton-line long" />
            </div>
          </template>
          <template v-else-if="visibleTenants.length === 0">
            <div class="tenant-empty-state">
              <strong>没有匹配的租户</strong>
              <p>调整关键字或筛选条件后，再次查看平台租户清单。</p>
            </div>
          </template>
          <template v-else>
            <div class="page-table-shell">
              <el-table
                :data="visibleTenants"
                row-key="id"
                :row-class-name="resolveTenantRowClassName"
                @row-click="handleSelectTenant"
              >
                <el-table-column label="租户" min-width="250">
                  <template #default="{ row }">
                    <div class="tenant-cell-primary">
                      <div class="tenant-name-row">
                        <strong>{{ row.name }}</strong>
                        <span v-if="row.isDefault" class="tenant-inline-chip">默认</span>
                      </div>
                      <span>{{ row.code }}</span>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="生命周期" width="124">
                  <template #default="{ row }">
                    <el-tag :type="resolveLifecycleTagType(row.lifecycleStatus)">
                      {{ formatLifecycleStatus(row.lifecycleStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="运行状态" width="124">
                  <template #default="{ row }">
                    <el-tag :type="resolveRuntimeTagType(row.runtimeStatus)">
                      {{ formatRuntimeStatus(row.runtimeStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="配额使用" min-width="228">
                  <template #default="{ row }">
                    <div class="tenant-cell-primary compact">
                      <strong>{{ row.usage.totalUsers }}/{{ row.quotas.users }} 用户</strong>
                      <span>{{ formatStorage(row.usage.storageUsedMb) }} / {{ formatStorage(row.quotas.storageQuotaMb) }}</span>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="负责人" min-width="188">
                  <template #default="{ row }">
                    <div class="tenant-cell-primary compact">
                      <strong>{{ row.ownerName }}</strong>
                      <span>{{ row.ownerEmail }}</span>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="228">
                  <template #default="{ row }">
                    <div class="tenant-row-actions">
                      <el-button
                        text
                        class="tenant-view-button"
                        :class="{ active: isSelectedTenant(row.id) }"
                        @click.stop="handleSelectTenant(row)"
                      >
                        {{ isSelectedTenant(row.id) ? "当前查看" : "查看" }}
                      </el-button>
                      <el-button text @click.stop="openQuotaDialog(row)">配额</el-button>
                      <el-button
                        v-if="row.lifecycleStatus === 'ACTIVE' && !row.isDefault"
                        text
                        @click.stop="changeLifecycle(row, 'disable')"
                      >
                        停用
                      </el-button>
                      <el-button
                        v-else-if="row.lifecycleStatus === 'DISABLED'"
                        text
                        @click.stop="changeLifecycle(row, 'enable')"
                      >
                        启用
                      </el-button>
                      <el-button
                        v-if="row.lifecycleStatus !== 'ARCHIVED' && !row.isDefault"
                        text
                        @click.stop="changeLifecycle(row, 'archive')"
                      >
                        归档
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </section>
      </div>
    </section>

    <el-drawer
      v-model="detailDrawerVisible"
      class="tenant-detail-drawer"
      :size="detailDrawerSize"
      destroy-on-close
      @closed="handleDetailDrawerClosed"
    >
      <template #header>
        <div v-if="selectedTenant" class="tenant-drawer-header">
          <div class="tenant-drawer-heading">
            <span class="page-kicker">租户运营</span>
            <h2>{{ selectedTenant.name }}</h2>
            <p>{{ selectedTenant.code }} · {{ selectedTenant.planName || "未设置套餐" }}</p>
          </div>

          <div class="tenant-detail-tags">
            <el-tag :type="resolveLifecycleTagType(selectedTenant.lifecycleStatus)">
              {{ formatLifecycleStatus(selectedTenant.lifecycleStatus) }}
            </el-tag>
            <el-tag :type="resolveRuntimeTagType(selectedTenant.runtimeStatus)">
              {{ formatRuntimeStatus(selectedTenant.runtimeStatus) }}
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="selectedTenant" class="tenant-drawer-content">
        <section class="tenant-detail-card spotlight" :class="{ 'tenant-detail-card--pulse': detailPulseActive }">
          <div class="tenant-detail-header">
            <div class="tenant-detail-heading">
              <span class="page-kicker">运营概览</span>
              <h3>{{ selectedTenant.ownerName }}</h3>
              <p>{{ selectedTenant.ownerEmail }}</p>
            </div>
          </div>

          <div class="tenant-detail-actions">
            <el-button @click="openQuotaDialog(selectedTenant)">调整配额</el-button>
            <el-button
              v-if="selectedTenant.lifecycleStatus === 'ACTIVE' && !selectedTenant.isDefault"
              @click="changeLifecycle(selectedTenant, 'disable')"
            >
              停用租户
            </el-button>
            <el-button
              v-else-if="selectedTenant.lifecycleStatus === 'DISABLED'"
              @click="changeLifecycle(selectedTenant, 'enable')"
            >
              重新启用
            </el-button>
            <el-button
              v-if="selectedTenant.lifecycleStatus !== 'ARCHIVED' && !selectedTenant.isDefault"
              @click="changeLifecycle(selectedTenant, 'archive')"
            >
              归档租户
            </el-button>
          </div>
        </section>

        <section class="tenant-detail-card">
          <div class="tenant-detail-block-title">
            <h3>运营摘要</h3>
            <span>负责人 / 套餐 / 活跃度</span>
          </div>

          <div class="tenant-meta-grid">
            <article class="tenant-meta-card">
              <span>负责人</span>
              <strong>{{ selectedTenant.ownerName }}</strong>
              <p>{{ selectedTenant.ownerEmail }}</p>
            </article>
            <article class="tenant-meta-card">
              <span>行业 / 套餐</span>
              <strong>{{ selectedTenant.planName }}</strong>
              <p>{{ selectedTenant.industry || "未设置行业标签" }}</p>
            </article>
            <article class="tenant-meta-card">
              <span>最后活跃</span>
              <strong>{{ formatDateTime(selectedTenant.usage.lastActivityAt) }}</strong>
              <p>初始化：{{ formatDateTime(selectedTenant.initializedAt) }}</p>
            </article>
          </div>
        </section>

        <section class="tenant-detail-card">
          <div class="tenant-detail-block-title">
            <h3>配额快照</h3>
            <span>使用量 / 配额上限</span>
          </div>

          <div class="tenant-quota-stack">
            <article class="tenant-quota-card">
              <div class="tenant-quota-topline">
                <span>用户席位</span>
                <strong>{{ selectedTenant.usage.totalUsers }} / {{ selectedTenant.quotas.users }}</strong>
              </div>
              <div class="tenant-quota-bar">
                <span :style="{ width: `${resolveQuotaRatio(selectedTenant.usage.totalUsers, selectedTenant.quotas.users)}%` }" />
              </div>
              <p>活跃用户 {{ selectedTenant.usage.activeUsers }}，适合观察组织扩张节奏。</p>
            </article>

            <article class="tenant-quota-card">
              <div class="tenant-quota-topline">
                <span>对象存储</span>
                <strong>{{ formatStorage(selectedTenant.usage.storageUsedMb) }} / {{ formatStorage(selectedTenant.quotas.storageQuotaMb) }}</strong>
              </div>
              <div class="tenant-quota-bar">
                <span :style="{ width: `${resolveQuotaRatio(selectedTenant.usage.storageUsedMb, selectedTenant.quotas.storageQuotaMb)}%` }" />
              </div>
              <p>适合监控附件、导入导出和交付文件的容量趋势。</p>
            </article>

            <article class="tenant-quota-card">
              <div class="tenant-quota-topline">
                <span>月度任务</span>
                <strong>{{ selectedTenant.usage.monthlyTasks }} / {{ selectedTenant.quotas.monthlyTasks }}</strong>
              </div>
              <div class="tenant-quota-bar">
                <span :style="{ width: `${resolveQuotaRatio(selectedTenant.usage.monthlyTasks, selectedTenant.quotas.monthlyTasks)}%` }" />
              </div>
              <p>任务额度反映导入、导出、同步和自动化执行密度。</p>
            </article>
          </div>
        </section>

        <section class="tenant-detail-card">
          <div class="tenant-detail-block-title">
            <h3>运行观察</h3>
            <span>运行重点</span>
          </div>

          <ul class="tenant-highlights">
            <li v-for="item in selectedTenant.runtimeHighlights" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>
    </el-drawer>

    <el-dialog
      v-model="createDialogVisible"
      class="entity-dialog"
      title="新建租户"
      width="640px"
      @closed="handleCreateDialogClosed"
    >
      <el-form :model="createForm" :rules="createRules" label-position="top" class="dialog-form" :ref="setCreateFormRef">
        <div class="tenant-form-grid">
          <el-form-item label="租户名称" prop="name">
            <el-input v-model="createForm.name" placeholder="例如：华东供应链中心" />
          </el-form-item>
          <el-form-item label="租户编码" prop="code">
            <el-input v-model="createForm.code" placeholder="例如：east-supply" />
          </el-form-item>
          <el-form-item label="行业">
            <el-input v-model="createForm.industry" placeholder="例如：制造业 / 零售 / 教育" />
          </el-form-item>
          <el-form-item label="套餐">
            <el-input v-model="createForm.planName" placeholder="例如：企业版" />
          </el-form-item>
          <el-form-item label="负责人" prop="ownerName">
            <el-input v-model="createForm.ownerName" placeholder="请输入租户负责人姓名" />
          </el-form-item>
          <el-form-item label="负责人邮箱" prop="ownerEmail">
            <el-input v-model="createForm.ownerEmail" placeholder="例如：owner@example.com" />
          </el-form-item>
          <el-form-item label="负责人电话">
            <el-input v-model="createForm.ownerPhone" placeholder="例如：13800000000" />
          </el-form-item>
          <el-form-item label="管理员账号" prop="adminUsername">
            <el-input v-model="createForm.adminUsername" placeholder="例如：acme.admin" />
          </el-form-item>
          <el-form-item label="管理员姓名" prop="adminDisplayName">
            <el-input v-model="createForm.adminDisplayName" placeholder="请输入初始化管理员姓名" />
          </el-form-item>
          <el-form-item label="管理员密码" prop="adminPassword">
            <el-input v-model="createForm.adminPassword" type="password" show-password placeholder="请输入初始登录密码" />
          </el-form-item>
          <el-form-item label="用户配额">
            <el-input-number v-model="createForm.userQuota" :min="1" placeholder="请输入可开通用户数" />
          </el-form-item>
          <el-form-item label="存储配额（MB）">
            <el-input-number v-model="createForm.storageQuotaMb" :min="128" placeholder="请输入存储配额" />
          </el-form-item>
          <el-form-item label="月度任务额度">
            <el-input-number v-model="createForm.monthlyTaskQuota" :min="100" placeholder="请输入月度任务额度" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="submitCreate">创建并初始化</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="quotaDialogVisible"
      class="entity-dialog"
      title="调整租户配额"
      width="520px"
      @closed="handleQuotaDialogClosed"
    >
      <el-form :model="quotaForm" :rules="quotaRules" label-position="top" class="dialog-form" :ref="setQuotaFormRef">
        <el-form-item label="租户">
          <el-input :model-value="quotaForm.tenantName" placeholder="请先选择租户" disabled />
        </el-form-item>
        <el-form-item label="用户配额" prop="userQuota">
          <el-input-number v-model="quotaForm.userQuota" :min="1" placeholder="请输入新的用户配额" />
        </el-form-item>
        <el-form-item label="存储配额（MB）" prop="storageQuotaMb">
          <el-input-number v-model="quotaForm.storageQuotaMb" :min="128" placeholder="请输入新的存储配额" />
        </el-form-item>
        <el-form-item label="月度任务额度" prop="monthlyTaskQuota">
          <el-input-number v-model="quotaForm.monthlyTaskQuota" :min="100" placeholder="请输入新的月度任务额度" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeQuotaDialog">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="submitQuotaUpdate">保存配额</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { formatDateTime } from "@/utils/display";
import { useTenantOperationsPage } from "@/composables/tenant-operations/useTenantOperationsPage";
import type { TenantLifecycleStatus, TenantRuntimeStatus } from "@/types/tenant-operations";
import type { TenantOperationsSnapshot } from "@/types/tenant-operations";

const {
  changeLifecycle,
  closeCreateDialog,
  closeQuotaDialog,
  createDialogVisible,
  createForm,
  createRules,
  handleCreateDialogClosed,
  handleQuotaDialogClosed,
  isLoading,
  isSubmitting,
  keyword,
  lifecycleFilter,
  lifecycleOptions,
  openCreateDialog,
  openQuotaDialog,
  quotaDialogVisible,
  quotaForm,
  quotaRules,
  runtimeFilter,
  runtimeOptions,
  selectTenant,
  selectedTenant,
  setCreateFormRef,
  setQuotaFormRef,
  submitCreate,
  submitQuotaUpdate,
  summaryItems,
  tenants,
  visibleTenants
} = useTenantOperationsPage();
const detailDrawerVisible = ref(false);
const detailPulseActive = ref(false);
const detailDrawerSize = "min(760px, calc(100vw - 24px))";

let detailPulseTimer: ReturnType<typeof setTimeout> | null = null;

function formatLifecycleStatus(value: TenantLifecycleStatus): string {
  return value === "ACTIVE" ? "启用" : value === "ARCHIVED" ? "已归档" : "已停用";
}

function formatRuntimeStatus(value: TenantRuntimeStatus): string {
  return value === "HEALTHY" ? "稳定" : value === "ERROR" ? "异常" : "关注";
}

function formatStorage(value: number): string {
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} GB`;
  }

  return `${value} MB`;
}

function resolveQuotaRatio(used: number, quota: number): number {
  if (!quota || quota <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(8, Math.round((used / quota) * 100)));
}

function resolveLifecycleTagType(value: TenantLifecycleStatus): "success" | "info" | "warning" {
  return value === "ACTIVE" ? "success" : value === "ARCHIVED" ? "info" : "warning";
}

function resolveRuntimeTagType(value: TenantRuntimeStatus): "success" | "danger" | "warning" {
  return value === "HEALTHY" ? "success" : value === "ERROR" ? "danger" : "warning";
}

function formatSummaryCaption(label: string): string {
  if (label === "租户总数") {
    return "当前平台已纳入运营视野的租户数量。";
  }

  if (label === "需关注") {
    return "运行状态并非稳定，建议优先排查。";
  }

  if (label === "已停用 / 已归档") {
    return "不再处于正常活跃生命周期的租户。";
  }

  return "资源使用接近上限，建议及时调配。";
}

function isSelectedTenant(tenantId: string): boolean {
  return selectedTenant.value?.id === tenantId;
}

function handleSelectTenant(tenant: TenantOperationsSnapshot): void {
  selectTenant(tenant);
  detailDrawerVisible.value = true;
  detailPulseActive.value = false;

  if (detailPulseTimer) {
    clearTimeout(detailPulseTimer);
  }

  requestAnimationFrame(() => {
    detailPulseActive.value = true;
  });

  detailPulseTimer = setTimeout(() => {
    detailPulseActive.value = false;
  }, 720);
}

function handleDetailDrawerClosed(): void {
  detailDrawerVisible.value = false;
  detailPulseActive.value = false;
}

function resolveTenantRowClassName({ row }: { row: TenantOperationsSnapshot }): string {
  return isSelectedTenant(row.id) ? "tenant-table-row-active" : "";
}
</script>

<style scoped>
.tenant-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.tenant-hero,
.tenant-shell {
  min-width: 0;
}

.tenant-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: 18px;
  align-items: stretch;
}

.tenant-hero-copy {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.tenant-hero-heading {
  display: grid;
  gap: 10px;
}

.tenant-hero-heading h1 {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(30px, 3vw, 40px);
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: var(--app-text-primary);
}

.tenant-hero-heading p {
  margin: 0;
  max-width: 760px;
  color: var(--app-text-secondary);
  line-height: 1.78;
  font-size: 14px;
}

.tenant-hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tenant-hero-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  background: rgba(37, 99, 235, 0.06);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 600;
}

.tenant-hero-panel {
  display: grid;
  gap: 14px;
  align-content: start;
  padding: 18px;
  border-radius: var(--app-radius-2xl);
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(255, 255, 255, 0.92) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.tenant-hero-metric,
.tenant-hero-focus {
  display: grid;
  gap: 4px;
}

.tenant-hero-metric span,
.tenant-hero-focus span {
  font-size: 12px;
  color: var(--app-text-tertiary);
}

.tenant-hero-metric strong,
.tenant-hero-focus strong {
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--app-text-primary);
}

.tenant-hero-focus strong {
  font-size: 22px;
  line-height: 1.1;
}

.tenant-hero-metric p,
.tenant-hero-focus p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.tenant-hero-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.24) 0%, rgba(148, 163, 184, 0.04) 100%);
}

.tenant-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.tenant-summary-card {
  display: grid;
  gap: 8px;
}

.tenant-summary-card[data-tone="warning"] {
  background:
    linear-gradient(180deg, rgba(255, 251, 235, 0.98) 0%, rgba(255, 255, 255, 0.96) 100%);
}

.tenant-summary-card[data-tone="muted"] {
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.96) 100%);
}

.tenant-summary-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-secondary);
}

.tenant-summary-card strong {
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--app-text-primary);
}

.tenant-summary-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.tenant-shell {
  display: grid;
  gap: 18px;
}

.tenant-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
}

.tenant-toolbar-search,
.tenant-toolbar-filter {
  display: grid;
  gap: 8px;
}

.tenant-toolbar-filters {
  display: grid;
  grid-template-columns: repeat(2, 180px);
  gap: 12px;
}

.tenant-toolbar-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-tertiary);
}

.tenant-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  min-width: 0;
  align-items: start;
}

.tenant-list-panel {
  min-width: 0;
}

.tenant-list-panel {
  display: grid;
  gap: 14px;
}

.tenant-panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.tenant-loading {
  display: grid;
  gap: 10px;
}

.tenant-empty-state {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 260px;
  border-radius: var(--app-radius-2xl);
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: rgba(248, 250, 252, 0.72);
  text-align: center;
}

.tenant-empty-state strong {
  font-size: 18px;
  color: var(--app-text-primary);
}

.tenant-empty-state p {
  margin: 0;
  max-width: 320px;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

.tenant-cell-primary {
  display: grid;
  gap: 4px;
}

.tenant-cell-primary.compact {
  gap: 3px;
}

.tenant-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tenant-cell-primary strong {
  font-size: 13px;
  color: var(--app-text-primary);
}

.tenant-cell-primary span {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.tenant-inline-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
  font-size: 11px;
  font-weight: 700;
}

.tenant-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.tenant-view-button.active {
  color: var(--app-accent-strong);
  font-weight: 700;
}

.tenant-detail-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: var(--app-radius-2xl);
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(255, 255, 255, 0.96) 100%);
  box-shadow: var(--app-shadow-soft);
}

.tenant-detail-card.spotlight {
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.09), transparent 42%),
    linear-gradient(180deg, rgba(241, 245, 249, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.tenant-detail-card--pulse {
  animation: tenant-detail-pulse 0.72s ease;
}

.tenant-drawer-header,
.tenant-drawer-content {
  display: grid;
  gap: 14px;
}

.tenant-drawer-header {
  min-width: 0;
}

.tenant-drawer-heading {
  display: grid;
  gap: 8px;
}

.tenant-drawer-heading h2 {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: 30px;
  line-height: 1.04;
  letter-spacing: -0.04em;
  color: var(--app-text-primary);
}

.tenant-drawer-heading p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.tenant-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.tenant-detail-heading {
  display: grid;
  gap: 8px;
}

.tenant-detail-heading h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: var(--app-text-primary);
}

.tenant-detail-heading p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.tenant-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.tenant-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tenant-detail-block-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.tenant-detail-block-title h3 {
  margin: 0;
  font-size: 16px;
  color: var(--app-text-primary);
}

.tenant-detail-block-title span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-tertiary);
}

.tenant-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tenant-meta-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--app-radius-xl);
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.tenant-meta-card span {
  font-size: 12px;
  color: var(--app-text-tertiary);
}

.tenant-meta-card strong {
  font-size: 17px;
  color: var(--app-text-primary);
}

.tenant-meta-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.tenant-quota-stack {
  display: grid;
  gap: 12px;
}

.tenant-quota-card {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--app-radius-xl);
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.tenant-quota-topline {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.tenant-quota-topline span {
  font-size: 12px;
  color: var(--app-text-tertiary);
}

.tenant-quota-topline strong {
  font-size: 18px;
  color: var(--app-text-primary);
}

.tenant-quota-bar {
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
}

.tenant-quota-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--app-accent) 0%, #60a5fa 100%);
}

.tenant-quota-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.tenant-highlights {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 18px;
  color: var(--app-text-secondary);
}

.tenant-highlights li {
  line-height: 1.7;
}

:deep(.tenant-table-row-active) {
  --el-table-tr-bg-color: rgba(37, 99, 235, 0.07);
}

:deep(.tenant-table-row-active td) {
  background: rgba(37, 99, 235, 0.07) !important;
}

:deep(.tenant-detail-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 0;
}

:deep(.tenant-detail-drawer .el-drawer__body) {
  padding-top: 18px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.05), transparent 30%),
    linear-gradient(180deg, rgba(245, 248, 252, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
}

@keyframes tenant-detail-pulse {
  0% {
    transform: translateY(0);
    box-shadow: var(--app-shadow-soft);
  }

  32% {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba(37, 99, 235, 0.14);
  }

  100% {
    transform: translateY(0);
    box-shadow: var(--app-shadow-soft);
  }
}

.tenant-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1320px) {
  .tenant-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .tenant-hero,
  .tenant-toolbar,
  .tenant-form-grid,
  .tenant-meta-grid {
    grid-template-columns: 1fr;
  }

  .tenant-toolbar-filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .tenant-summary-grid,
  .tenant-toolbar-filters {
    grid-template-columns: 1fr;
  }

  .tenant-drawer-header,
  .tenant-detail-header,
  .tenant-detail-block-title,
  .tenant-quota-topline {
    flex-direction: column;
    align-items: flex-start;
  }

  .tenant-detail-tags,
  .tenant-detail-actions {
    justify-content: flex-start;
  }
}
</style>
