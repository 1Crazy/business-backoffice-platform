<!-- system-administration 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <section class="system-page page-card">
    <el-tabs>
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
          :table-state="auditTableState"
          :current-sort-label="currentAuditSortLabel"
          @refresh="loadAuditLogs"
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
  loadAuditLogs,
  openDictionaryDialog,
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

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}
</style>
