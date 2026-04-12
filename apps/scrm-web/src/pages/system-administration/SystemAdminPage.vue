<!-- system-administration 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <section class="system-page page-card">
    <template v-if="isInitialLoading">
      <div class="system-skeleton">
        <div class="system-tabs-skeleton">
          <span class="ui-skeleton ui-skeleton-pill" />
          <span class="ui-skeleton ui-skeleton-pill" />
        </div>
        <div class="system-body-skeleton">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <div v-for="item in 4" :key="item" class="system-row-skeleton">
            <span class="ui-skeleton ui-skeleton-line medium" />
            <span class="ui-skeleton ui-skeleton-line short" />
            <span class="ui-skeleton ui-skeleton-line long" />
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <el-tabs class="system-tabs">
        <el-tab-pane label="字典配置">
          <DictionaryManagementSection
            :dictionary-entries="dictionaryEntries"
            @create="openDictionaryDialog"
            @edit="openDictionaryDialog"
          />
        </el-tab-pane>

        <el-tab-pane label="审计日志">
          <AuditLogsSection
            :filter="auditFilter"
            :audit-logs="auditLogs"
            :audit-action-options="auditActionOptions"
            :audit-target-type-options="auditTargetTypeOptions"
            :audit-sort-options="auditSortOptions"
            :loading="isAuditLoading"
            :refreshing="isAuditRefreshing"
            :table-state="auditTableState"
            :current-sort-label="currentAuditSortLabel"
            @reset="resetAuditFilters"
            @update:sort-preset="auditTableState.sortPreset = $event"
            @page-change="handleAuditPageChange"
            @page-size-change="handleAuditPageSizeChange"
          />
        </el-tab-pane>
      </el-tabs>

      <DictionaryDialog
        v-model:visible="dictionaryDialogVisible"
        :form="dictionaryForm"
        :rules="dictionaryRules"
        :set-form-ref="setDictionaryFormRef"
        @submit="submitDictionary"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import AuditLogsSection from "@/pages/system-administration/components/AuditLogsSection.vue";
import DictionaryDialog from "@/pages/system-administration/components/DictionaryDialog.vue";
import DictionaryManagementSection from "@/pages/system-administration/components/DictionaryManagementSection.vue";
import { useSystemAdministrationPage } from "@/composables/system-administration/useSystemAdministrationPage";

const {
  auditActionOptions,
  auditFilter,
  auditLogs,
  auditSortOptions,
  auditTableState,
  auditTargetTypeOptions,
  currentAuditSortLabel,
  dictionaryDialogVisible,
  dictionaryEntries,
  dictionaryForm,
  dictionaryRules,
  handleAuditPageChange,
  handleAuditPageSizeChange,
  isAuditLoading,
  isAuditRefreshing,
  isInitialLoading,
  openDictionaryDialog,
  resetAuditFilters,
  setDictionaryFormRef,
  submitDictionary
} = useSystemAdministrationPage();
</script>

<style scoped>
.system-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.system-skeleton,
.system-body-skeleton {
  display: grid;
  gap: 12px;
}

.system-tabs-skeleton {
  display: flex;
  gap: 10px;
}

.system-row-skeleton {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.62);
}

:deep(.el-tabs__nav-scroll) {
  display: flex;
}

:deep(.system-tabs .el-tabs__nav) {
  margin-left: 0;
}

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}
</style>
