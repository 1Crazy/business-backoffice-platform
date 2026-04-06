<!-- leads 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="page-stack">
    <LeadReminderSection
      :reminders="reminders"
      :table-state="reminderTableState"
      @refresh="loadReminders"
      @page-change="handleReminderPageChange"
    />

    <LeadsFilterSection
      :filters="filters"
      :source-options="sourceOptions"
      :users="users"
      :lead-statuses="leadStatuses"
      :sort-options="leadSortOptions"
      :sort-preset="leadTableState.sortPreset"
      @refresh="loadLeads"
      @create-lead="openLeadDialog"
      @update:sort-preset="leadTableState.sortPreset = $event"
    />

    <LeadsTableSection
      :leads="leads"
      :table-state="leadTableState"
      :current-sort-label="currentLeadSortLabel"
      :is-desktop="isDesktop"
      @edit="openLeadDialog"
      @assign="openOwnerDialog"
      @convert="convertLead"
      @follow-up="openFollowUpDrawer"
      @page-change="handleLeadPageChange"
      @page-size-change="handleLeadPageSizeChange"
    />

    <LeadEditorDialog
      v-model:visible="leadDialogVisible"
      :form="leadForm"
      :rules="leadRules"
      :users="users"
      :source-options="sourceOptions"
      :lead-statuses="leadStatuses"
      :set-form-ref="setLeadFormRef"
      @submit="submitLead"
    />

    <LeadOwnerDialog
      v-model:visible="ownerDialogVisible"
      :form="ownerForm"
      :rules="ownerRules"
      :users="users"
      :set-form-ref="setOwnerFormRef"
      @submit="submitOwner"
    />

    <LeadFollowUpDrawer
      v-model:visible="followUpDrawerVisible"
      :lead="selectedLead"
      :follow-ups="followUps"
      :form="followUpForm"
      :rules="followUpRules"
      :attachments="attachments"
      :is-tablet-or-down="isTabletOrDown"
      :set-form-ref="setFollowUpFormRef"
      @submit-follow-up="submitFollowUp"
      @upload="handleUploadAttachment"
    />
  </div>
</template>

<script setup lang="ts">
import LeadEditorDialog from "@/pages/leads/components/LeadEditorDialog.vue";
import LeadFollowUpDrawer from "@/pages/leads/components/LeadFollowUpDrawer.vue";
import LeadOwnerDialog from "@/pages/leads/components/LeadOwnerDialog.vue";
import LeadReminderSection from "@/pages/leads/components/LeadReminderSection.vue";
import LeadsFilterSection from "@/pages/leads/components/LeadsFilterSection.vue";
import LeadsTableSection from "@/pages/leads/components/LeadsTableSection.vue";
import { useLeadsPage } from "@/composables/leads/useLeadsPage";

const {
  attachments,
  convertLead,
  currentLeadSortLabel,
  filters,
  followUpDrawerVisible,
  followUpForm,
  followUpRules,
  followUps,
  handleLeadPageChange,
  handleLeadPageSizeChange,
  handleReminderPageChange,
  handleUploadAttachment,
  isDesktop,
  isTabletOrDown,
  leadDialogVisible,
  leadForm,
  leadRules,
  leadSortOptions,
  leadStatuses,
  leadTableState,
  leads,
  loadLeads,
  loadReminders,
  openFollowUpDrawer,
  openLeadDialog,
  openOwnerDialog,
  ownerDialogVisible,
  ownerForm,
  ownerRules,
  reminderTableState,
  reminders,
  selectedLead,
  setFollowUpFormRef,
  setLeadFormRef,
  setOwnerFormRef,
  sourceOptions,
  submitFollowUp,
  submitLead,
  submitOwner,
  users
} = useLeadsPage();
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}
</style>
