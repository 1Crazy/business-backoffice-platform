<!-- opportunities 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="page-stack">
    <OpportunitiesFilterSection
      :filters="filters"
      :loading="isMetaLoading"
      :customers="customers"
      :users="users"
      :stage-options="opportunityStageOptions"
      :result-options="opportunityResultOptions"
      :sort-options="opportunitySortOptions"
      :sort-preset="opportunityTableState.sortPreset"
      @refresh="loadOpportunities"
      @create-opportunity="openOpportunityDialog"
      @update:sort-preset="opportunityTableState.sortPreset = $event"
    />

    <OpportunitiesTableSection
      :opportunities="opportunities"
      :loading="isTableLoading"
      :refreshing="isTableRefreshing"
      :table-state="opportunityTableState"
      :current-sort-label="currentOpportunitySortLabel"
      @detail="openDetailDrawer"
      @edit="openOpportunityDialog"
      @transfer="openOwnerDialog"
      @advance="openStageDialog"
      @mark-won="openCloseDialog($event, 'WON')"
      @mark-lost="openCloseDialog($event, 'LOST')"
      @page-change="handleOpportunityPageChange"
      @page-size-change="handleOpportunityPageSizeChange"
    />

    <OpportunityEditorDialog
      v-model:visible="opportunityDialogVisible"
      :form="opportunityForm"
      :rules="opportunityRules"
      :users="users"
      :customers="customers"
      :leads="leads"
      :stage-options="inProgressStageOptions"
      :set-form-ref="setOpportunityFormRef"
      @submit="submitOpportunity"
    />

    <OpportunityOwnerDialog
      v-model:visible="ownerDialogVisible"
      :form="ownerForm"
      :rules="ownerRules"
      :users="users"
      :set-form-ref="setOwnerFormRef"
      @submit="submitOwner"
    />

    <OpportunityStageDialog
      v-model:visible="stageDialogVisible"
      :opportunity="selectedOpportunity"
      :form="stageForm"
      :rules="stageRules"
      :stage-options="stageDialogOptions"
      :set-form-ref="setStageFormRef"
      @submit="submitStage"
    />

    <OpportunityCloseDialog
      v-model:visible="closeDialogVisible"
      :mode="closeMode"
      :opportunity="selectedOpportunity"
      :form="closeForm"
      :rules="closeRules"
      :set-form-ref="setCloseFormRef"
      @submit="submitClose"
    />

    <OpportunityDetailDrawer
      v-model:visible="detailDrawerVisible"
      :opportunity="selectedOpportunity"
      :is-tablet-or-down="isTabletOrDown"
    />
  </div>
</template>

<script setup lang="ts">
import { useOpportunitiesPage } from "@/composables/opportunities/useOpportunitiesPage";
import OpportunityCloseDialog from "@/pages/opportunities/components/OpportunityCloseDialog.vue";
import OpportunityDetailDrawer from "@/pages/opportunities/components/OpportunityDetailDrawer.vue";
import OpportunityEditorDialog from "@/pages/opportunities/components/OpportunityEditorDialog.vue";
import OpportunityOwnerDialog from "@/pages/opportunities/components/OpportunityOwnerDialog.vue";
import OpportunitiesFilterSection from "@/pages/opportunities/components/OpportunitiesFilterSection.vue";
import OpportunitiesTableSection from "@/pages/opportunities/components/OpportunitiesTableSection.vue";
import OpportunityStageDialog from "@/pages/opportunities/components/OpportunityStageDialog.vue";

const {
  closeDialogVisible,
  closeForm,
  closeMode,
  closeRules,
  currentOpportunitySortLabel,
  customers,
  detailDrawerVisible,
  filters,
  handleOpportunityPageChange,
  handleOpportunityPageSizeChange,
  inProgressStageOptions,
  isMetaLoading,
  isTableLoading,
  isTableRefreshing,
  isTabletOrDown,
  leads,
  loadOpportunities,
  openCloseDialog,
  openDetailDrawer,
  openOpportunityDialog,
  openOwnerDialog,
  openStageDialog,
  opportunityDialogVisible,
  opportunityForm,
  opportunityResultOptions,
  opportunityRules,
  opportunitySortOptions,
  opportunityStageOptions,
  opportunityTableState,
  opportunities,
  ownerDialogVisible,
  ownerForm,
  ownerRules,
  selectedOpportunity,
  setCloseFormRef,
  setOpportunityFormRef,
  setOwnerFormRef,
  setStageFormRef,
  stageDialogOptions,
  stageDialogVisible,
  stageForm,
  stageRules,
  submitClose,
  submitOpportunity,
  submitOwner,
  submitStage,
  users
} = useOpportunitiesPage();
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}
</style>
