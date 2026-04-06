<!-- customers 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="page-stack">
    <CustomersFilterSection
      :filters="filters"
      :source-options="sourceOptions"
      :status-options="statusOptions"
      :users="users"
      :tags="tags"
      :sort-options="customerSortOptions"
      :sort-preset="customerTableState.sortPreset"
      @refresh="loadCustomers"
      @create-tag="openTagDialog"
      @create-customer="openCustomerDialog"
      @update:sort-preset="customerTableState.sortPreset = $event"
    />

    <CustomersTableSection
      :customers="customers"
      :table-state="customerTableState"
      :current-sort-label="currentCustomerSortLabel"
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
import CustomerEditorDialog from "@/pages/customers/components/CustomerEditorDialog.vue";
import CustomerFollowUpDrawer from "@/pages/customers/components/CustomerFollowUpDrawer.vue";
import CustomerOwnerDialog from "@/pages/customers/components/CustomerOwnerDialog.vue";
import CustomerTagDialog from "@/pages/customers/components/CustomerTagDialog.vue";
import CustomersFilterSection from "@/pages/customers/components/CustomersFilterSection.vue";
import CustomersTableSection from "@/pages/customers/components/CustomersTableSection.vue";
import { useCustomersPage } from "@/composables/customers/useCustomersPage";

const {
  attachments,
  currentCustomerSortLabel,
  customerDialogVisible,
  customerForm,
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
  isTabletOrDown,
  loadCustomers,
  openCustomerDialog,
  openFollowUpDrawer,
  openOwnerDialog,
  openTagDialog,
  ownerDialogVisible,
  ownerForm,
  ownerRules,
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
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}
</style>
