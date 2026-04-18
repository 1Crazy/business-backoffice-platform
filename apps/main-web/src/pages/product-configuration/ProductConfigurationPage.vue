<template>
  <div class="config-page">
    <section class="page-card config-hero">
      <div class="config-hero-copy">
        <span class="config-kicker">租户配置中心</span>
        <h1>默认值、行业模板和租户覆盖的统一视图</h1>
        <p>同一项配置可以清楚看到来自平台默认、行业模板还是当前租户覆盖，并且更新后会立即影响主应用菜单与壳层主题。</p>
      </div>
    </section>

    <section class="config-summary-grid">
      <article v-for="item in summaryItems" :key="item.label" class="page-card config-summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="page-card config-shell">
      <div class="config-scope-tabs">
        <button
          v-for="scope in scopeOrder"
          :key="scope"
          type="button"
          class="config-scope-tab"
          :class="{ active: activeScope === scope }"
          @click="selectScope(scope)"
        >
          {{ formatScope(scope) }}
        </button>
      </div>

      <div class="config-content">
        <div class="config-list">
          <template v-if="isLoading">
            <div class="config-loading">
              <span v-for="item in 5" :key="item" class="ui-skeleton ui-skeleton-line long" />
            </div>
          </template>
          <template v-else>
            <el-table :data="visibleEntries" @row-click="selectEntry">
              <el-table-column label="配置项" min-width="220">
                <template #default="{ row }">
                  <div class="config-cell">
                    <strong>{{ row.displayName }}</strong>
                    <span>{{ row.configKey }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="生效来源" width="130">
                <template #default="{ row }">
                  <el-tag :type="row.effectiveSource === 'TENANT_OVERRIDE' ? 'success' : row.effectiveSource === 'INDUSTRY_TEMPLATE' ? 'warning' : 'info'">
                    {{ formatSource(row.effectiveSource) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="摘要" min-width="280">
                <template #default="{ row }">
                  <span class="config-summary-text">{{ summarizeValue(row.effectiveValue) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="110">
                <template #default="{ row }">
                  <el-button text @click.stop="openEditDialog(row)">覆盖</el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </div>

        <aside v-if="selectedEntry" class="config-detail">
          <div class="config-detail-header">
            <div>
              <span class="config-kicker">来源说明</span>
              <h2>{{ selectedEntry.displayName }}</h2>
            </div>
            <el-tag :type="selectedEntry.effectiveSource === 'TENANT_OVERRIDE' ? 'success' : selectedEntry.effectiveSource === 'INDUSTRY_TEMPLATE' ? 'warning' : 'info'">
              {{ formatSource(selectedEntry.effectiveSource) }}
            </el-tag>
          </div>

          <article class="config-value-card emphasis">
            <span>最终生效值</span>
            <pre>{{ formatValue(selectedEntry.effectiveValue) }}</pre>
          </article>

          <div class="config-source-grid">
            <article class="config-value-card">
              <span>平台默认</span>
              <pre>{{ formatValue(selectedEntry.platformDefaultValue) }}</pre>
            </article>
            <article class="config-value-card">
              <span>行业模板</span>
              <pre>{{ formatValue(selectedEntry.industryTemplateValue) }}</pre>
            </article>
            <article class="config-value-card">
              <span>租户覆盖</span>
              <pre>{{ formatValue(selectedEntry.tenantOverrideValue) }}</pre>
            </article>
          </div>
        </aside>
      </div>
    </section>

    <el-dialog v-model="editDialogVisible" title="编辑租户覆盖值" width="640px">
      <el-form :model="overrideForm" :rules="rules" label-position="top" :ref="setFormRef">
        <el-form-item label="配置名称" prop="displayName">
          <el-input v-model="overrideForm.displayName" placeholder="请输入配置名称" />
        </el-form-item>

        <el-form-item label="说明">
          <el-input v-model="overrideForm.description" type="textarea" :rows="2" placeholder="请输入配置说明" />
        </el-form-item>

        <template v-if="overrideForm.scope === 'MENU'">
          <el-form-item label="菜单标签">
            <el-input v-model="overrideForm.label" placeholder="请输入菜单标签" />
          </el-form-item>
          <el-form-item label="是否显示">
            <el-switch v-model="overrideForm.visible" />
          </el-form-item>
        </template>

        <template v-else-if="overrideForm.scope === 'FIELD_SCHEME'">
          <el-form-item label="字段标签">
            <el-input v-model="overrideForm.label" placeholder="请输入字段标签" />
          </el-form-item>
          <el-form-item label="字段可见">
            <el-switch v-model="overrideForm.visible" />
          </el-form-item>
          <el-form-item label="字段必填">
            <el-switch v-model="overrideForm.required" />
          </el-form-item>
        </template>

        <template v-else-if="overrideForm.scope === 'FORM_TEMPLATE'">
          <el-form-item label="表单标题">
            <el-input v-model="overrideForm.title" placeholder="请输入表单标题" />
          </el-form-item>
          <el-form-item label="布局模式">
            <el-input v-model="overrideForm.layout" placeholder="例如：双栏布局 / 单栏布局" />
          </el-form-item>
          <el-form-item label="必填字段（逗号分隔）">
            <el-input
              v-model="overrideForm.requiredFieldsText"
              type="textarea"
              :rows="3"
              placeholder="多个字段使用逗号分隔，例如 name, mobile, amount"
            />
          </el-form-item>
        </template>

        <template v-else-if="overrideForm.scope === 'THEME'">
          <div class="config-form-grid">
            <el-form-item label="品牌名称">
              <el-input v-model="overrideForm.brandName" placeholder="请输入品牌名称" />
            </el-form-item>
            <el-form-item label="导航模式">
              <el-input v-model="overrideForm.navigationMode" placeholder="例如：side / top" />
            </el-form-item>
            <el-form-item label="主色">
              <el-input v-model="overrideForm.primaryColor" placeholder="例如：#2563eb" />
            </el-form-item>
            <el-form-item label="强调色">
              <el-input v-model="overrideForm.accentColor" placeholder="例如：#f97316" />
            </el-form-item>
            <el-form-item label="背景染色">
              <el-input v-model="overrideForm.surfaceTint" placeholder="例如：#eff6ff" />
            </el-form-item>
          </div>
        </template>

        <template v-else>
          <el-form-item label="模板标题">
            <el-input v-model="overrideForm.title" placeholder="请输入模板标题" />
          </el-form-item>
          <el-form-item label="模板说明">
            <el-input v-model="overrideForm.summary" type="textarea" :rows="3" placeholder="请输入模板说明" />
          </el-form-item>
          <el-form-item label="操作按钮文案">
            <el-input v-model="overrideForm.ctaLabel" placeholder="请输入按钮文案" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="submitOverride">保存覆盖值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useProductConfigurationPage } from "@/composables/product-configuration/useProductConfigurationPage";
import type { ProductConfigLayer, ProductConfigScope } from "@/types/product-configuration";

const {
  activeScope,
  editDialogVisible,
  isLoading,
  isSubmitting,
  openEditDialog,
  overrideForm,
  rules,
  scopeOrder,
  selectedEntry,
  selectEntry,
  selectScope,
  setFormRef,
  submitOverride,
  summaryItems,
  visibleEntries
} = useProductConfigurationPage();

function formatScope(scope: ProductConfigScope): string {
  if (scope === "MENU") return "菜单";
  if (scope === "FIELD_SCHEME") return "字段";
  if (scope === "FORM_TEMPLATE") return "表单";
  if (scope === "THEME") return "主题";
  return "模板";
}

function formatSource(source: ProductConfigLayer): string {
  if (source === "TENANT_OVERRIDE") return "租户覆盖";
  if (source === "INDUSTRY_TEMPLATE") return "行业模板";
  return "平台默认";
}

function summarizeValue(value: Record<string, unknown>): string {
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${Array.isArray(item) ? item.join("/") : String(item)}`)
    .join(" · ");
}

function formatValue(value?: Record<string, unknown> | null): string {
  if (!value) {
    return "未提供";
  }

  return JSON.stringify(value, null, 2);
}
</script>

<style scoped>
.config-page {
  display: grid;
  gap: 16px;
}

.config-hero,
.config-summary-grid,
.config-shell {
  min-width: 0;
}

.config-hero-copy {
  display: grid;
  gap: 10px;
}

.config-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.config-hero-copy h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  color: #0f172a;
}

.config-hero-copy p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
  max-width: 760px;
}

.config-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.config-summary-card {
  display: grid;
  gap: 8px;
}

.config-summary-card span {
  font-size: 12px;
  color: #64748b;
}

.config-summary-card strong {
  font-size: 28px;
  color: #0f172a;
}

.config-shell {
  display: grid;
  gap: 16px;
}

.config-scope-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.config-scope-tab {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  color: #475569;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  transition: all 180ms ease;
  cursor: pointer;
}

.config-scope-tab.active {
  border-color: rgba(37, 99, 235, 0.28);
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.config-content {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
  gap: 16px;
  min-width: 0;
}

.config-list,
.config-detail {
  min-width: 0;
}

.config-loading {
  display: grid;
  gap: 10px;
}

.config-cell {
  display: grid;
  gap: 2px;
}

.config-cell strong {
  color: #0f172a;
}

.config-cell span,
.config-summary-text {
  color: #64748b;
  font-size: 12px;
}

.config-detail {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(248, 250, 252, 0.88);
}

.config-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.config-detail-header h2 {
  margin: 6px 0 0;
  font-size: 24px;
  color: #0f172a;
}

.config-source-grid,
.config-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.config-value-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #ffffff;
}

.config-value-card.emphasis {
  border-color: rgba(37, 99, 235, 0.18);
  background: rgba(239, 246, 255, 0.8);
}

.config-value-card span {
  font-size: 12px;
  color: #64748b;
}

.config-value-card pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
  color: #0f172a;
}

@media (max-width: 1180px) {
  .config-summary-grid,
  .config-content {
    grid-template-columns: 1fr;
  }
}
</style>
