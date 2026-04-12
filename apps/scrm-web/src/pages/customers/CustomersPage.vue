<!-- customers 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="page-stack">
    <CustomersFilterSection
      :filters="filters"
      :loading="isMetaLoading"
      :source-options="sourceOptions"
      :status-options="statusOptions"
      :users="users"
      :tags="tags"
      :sort-options="customerSortOptions"
      :sort-preset="customerTableState.sortPreset"
      @reset="resetCustomerFilters"
      @create-tag="openTagDialog"
      @create-customer="openCustomerDialog"
      @update:sort-preset="customerTableState.sortPreset = $event"
    />

    <CustomersTableSection
      :customers="customers"
      :loading="isTableLoading"
      :refreshing="isTableRefreshing"
      :table-state="customerTableState"
      :current-sort-label="currentCustomerSortLabel"
      :source-options="sourceOptions"
      :status-options="statusOptions"
      :is-desktop="isDesktop"
      @edit="openCustomerDialog"
      @transfer="openOwnerDialog"
      @follow-up="openFollowUpDrawer"
      @page-change="handleCustomerPageChange"
      @page-size-change="handleCustomerPageSizeChange"
    />

    <CustomerEditorDialog
      v-model:visible="customerDialogVisible"
      :form="customerForm"
      :rules="customerRules"
      :users="users"
      :tags="tags"
      :source-options="sourceOptions"
      :status-options="statusOptions"
      :set-form-ref="setCustomerFormRef"
      @submit="submitCustomer"
    />

    <CustomerTagDialog
      v-model:visible="tagDialogVisible"
      :form="tagForm"
      :rules="tagRules"
      :set-form-ref="setTagFormRef"
      @submit="submitTag"
    />

    <CustomerOwnerDialog
      v-model:visible="ownerDialogVisible"
      :form="ownerForm"
      :rules="ownerRules"
      :users="users"
      :set-form-ref="setOwnerFormRef"
      @submit="submitOwner"
    />

    <CustomerFollowUpDrawer
      v-model:visible="followUpDrawerVisible"
      :customer="selectedCustomer"
      :revenue-overview="customerRevenueOverview"
      :follow-ups="followUps"
      :form="followUpForm"
      :rules="followUpRules"
      :attachments="attachments"
      :is-tablet-or-down="isTabletOrDown"
      :set-form-ref="setFollowUpFormRef"
      @open-revenue="openRevenueWorkspace"
      @submit-follow-up="submitFollowUp"
      @upload="handleUploadAttachment"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import CustomerEditorDialog from "@/pages/customers/components/CustomerEditorDialog.vue";
import CustomerFollowUpDrawer from "@/pages/customers/components/CustomerFollowUpDrawer.vue";
import CustomerOwnerDialog from "@/pages/customers/components/CustomerOwnerDialog.vue";
import CustomerTagDialog from "@/pages/customers/components/CustomerTagDialog.vue";
import CustomersFilterSection from "@/pages/customers/components/CustomersFilterSection.vue";
import CustomersTableSection from "@/pages/customers/components/CustomersTableSection.vue";
import { useCustomersPage } from "@/composables/customers/useCustomersPage";

const router = useRouter();

const {
  attachments,
  currentCustomerSortLabel,
  customerDialogVisible,
  customerForm,
  customerRevenueOverview,
  customerRules,
  customerSortOptions,
  customerTableState,
  customers,
  filters,
  followUpDrawerVisible,
  followUpForm,
  followUpRules,
  followUps,
  handleCustomerPageChange,
  handleCustomerPageSizeChange,
  handleUploadAttachment,
  isDesktop,
  isMetaLoading,
  isTableLoading,
  isTableRefreshing,
  isTabletOrDown,
  openCustomerDialog,
  openFollowUpDrawer,
  openOwnerDialog,
  openTagDialog,
  ownerDialogVisible,
  ownerForm,
  ownerRules,
  resetCustomerFilters,
  selectedCustomer,
  setCustomerFormRef,
  setFollowUpFormRef,
  setOwnerFormRef,
  setTagFormRef,
  sourceOptions,
  statusOptions,
  submitCustomer,
  submitFollowUp,
  submitOwner,
  submitTag,
  tagDialogVisible,
  tagForm,
  tagRules,
  tags,
  users
} = useCustomersPage();

function openRevenueWorkspace(): void {
  if (!selectedCustomer.value) {
    return;
  }

  void router.push({
    path: "/revenue-operations",
    query: {
      customerId: selectedCustomer.value.id
    }
  });
}
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}
</style>
