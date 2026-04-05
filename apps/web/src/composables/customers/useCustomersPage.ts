import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, UploadRequestOptions } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import {
  createCustomer,
  createCustomerFollowUp,
  createCustomerTag,
  fetchCustomerDetail,
  fetchCustomerFollowUps,
  fetchCustomerMeta,
  fetchCustomers,
  transferCustomerOwner,
  updateCustomer
} from "@/api/customers.api";
import { useViewport } from "@/composables/useViewport";
import { useRecordUploads } from "@/composables/uploads/useRecordUploads";
import type { User } from "@/types/access-control";
import type {
  CreateCustomerFollowUpPayload,
  CreateCustomerPayload,
  CreateCustomerTagPayload,
  Customer,
  CustomerFilters,
  CustomerFormModel,
  CustomerListQuery,
  CustomerOwnerFormModel,
  CustomerTableState,
  CustomerTag,
  CustomerTagFormModel,
  TransferCustomerOwnerPayload,
  UpdateCustomerPayload
} from "@/types/customers";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { FollowUp, FollowUpFormModel } from "@/types/follow-ups";
import {
  normalizeOptionalArray,
  normalizeOptionalTextForCreate,
  normalizeOptionalTextForUpdate,
  normalizeRequiredText
} from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const customerSortOptions = [
  { value: "createdAt:desc", label: "最新创建", sortBy: "createdAt", sortOrder: "desc" },
  { value: "updatedAt:desc", label: "最近更新", sortBy: "updatedAt", sortOrder: "desc" },
  { value: "name:asc", label: "名称 A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "status:asc", label: "状态升序", sortBy: "status", sortOrder: "asc" }
] as const;

export function useCustomersPage() {
  const customers = ref<Customer[]>([]);
  const users = ref<User[]>([]);
  const tags = ref<CustomerTag[]>([]);
  const sourceOptions = ref<DictionaryEntry[]>([]);
  const statusOptions = ref<DictionaryEntry[]>([]);
  const followUps = ref<FollowUp[]>([]);

  const customerDialogVisible = ref(false);
  const tagDialogVisible = ref(false);
  const ownerDialogVisible = ref(false);
  const followUpDrawerVisible = ref(false);
  const selectedCustomer = ref<Customer | null>(null);

  const customerFormRef = ref<FormInstance>();
  const tagFormRef = ref<FormInstance>();
  const ownerFormRef = ref<FormInstance>();
  const followUpFormRef = ref<FormInstance>();

  const filters = reactive<CustomerFilters>({
    keyword: "",
    source: "",
    status: "",
    ownerId: "",
    tagId: ""
  });

  const customerTableState = reactive<CustomerTableState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
    sortPreset: "createdAt:desc"
  });

  const customerForm = reactive<CustomerFormModel>({
    id: "",
    name: "",
    contactName: "",
    phone: "",
    email: "",
    source: "",
    status: "",
    ownerId: "",
    notes: "",
    tagIds: []
  });

  const tagForm = reactive<CustomerTagFormModel>({
    name: "",
    color: "#2563eb"
  });

  const ownerForm = reactive<CustomerOwnerFormModel>({
    ownerId: ""
  });

  const followUpForm = reactive<FollowUpFormModel>({
    content: "",
    nextFollowUpAt: ""
  });

  const customerRules: FormRules<CustomerFormModel> = {
    name: [
      { required: true, message: "请输入客户名称", trigger: "blur" },
      { min: 2, message: "客户名称至少需要 2 个字符", trigger: "blur" }
    ],
    ownerId: [{ required: true, message: "请选择归属人", trigger: "change" }],
    email: [{ type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }]
  };

  const tagRules: FormRules<CustomerTagFormModel> = {
    name: [{ required: true, message: "请输入标签名称", trigger: "blur" }]
  };

  const ownerRules: FormRules<CustomerOwnerFormModel> = {
    ownerId: [{ required: true, message: "请选择新的归属人", trigger: "change" }]
  };

  const followUpRules: FormRules<FollowUpFormModel> = {
    content: [{ required: true, message: "请输入跟进内容", trigger: "blur" }]
  };

  const { isDesktop, isTabletOrDown } = useViewport();

  const currentCustomerSortLabel = computed(
    () => customerSortOptions.find((item) => item.value === customerTableState.sortPreset)?.label ?? "最新创建"
  );

  const { attachments, handleUpload: handleAttachmentUpload } = useRecordUploads({
    getQuery: () =>
      selectedCustomer.value
        ? {
            businessType: "CUSTOMER",
            businessId: selectedCustomer.value.id
          }
        : null
  });

  function setCustomerFormRef(instance: FormInstance | undefined): void {
    customerFormRef.value = instance;
  }

  function setTagFormRef(instance: FormInstance | undefined): void {
    tagFormRef.value = instance;
  }

  function setOwnerFormRef(instance: FormInstance | undefined): void {
    ownerFormRef.value = instance;
  }

  function setFollowUpFormRef(instance: FormInstance | undefined): void {
    followUpFormRef.value = instance;
  }

  function resetCustomerForm(): void {
    customerForm.id = "";
    customerForm.name = "";
    customerForm.contactName = "";
    customerForm.phone = "";
    customerForm.email = "";
    customerForm.source = "";
    customerForm.status = "";
    customerForm.ownerId = users.value[0]?.id ?? "";
    customerForm.notes = "";
    customerForm.tagIds = [];
  }

  function resetTagForm(): void {
    tagForm.name = "";
    tagForm.color = "#2563eb";
  }

  function buildCustomerListQuery(): CustomerListQuery {
    return {
      keyword: filters.keyword || undefined,
      source: filters.source || undefined,
      status: filters.status || undefined,
      ownerId: filters.ownerId || undefined,
      tagId: filters.tagId || undefined,
      page: customerTableState.page,
      pageSize: customerTableState.pageSize,
      sortBy: customerTableState.sortBy,
      sortOrder: customerTableState.sortOrder
    };
  }

  function buildCreateCustomerPayload(): CreateCustomerPayload {
    return {
      name: normalizeRequiredText(customerForm.name),
      contactName: normalizeOptionalTextForCreate(customerForm.contactName),
      phone: normalizeOptionalTextForCreate(customerForm.phone),
      email: normalizeOptionalTextForCreate(customerForm.email),
      source: normalizeOptionalTextForCreate(customerForm.source),
      status: normalizeOptionalTextForCreate(customerForm.status),
      ownerId: normalizeRequiredText(customerForm.ownerId),
      notes: normalizeOptionalTextForCreate(customerForm.notes),
      tagIds: normalizeOptionalArray(customerForm.tagIds)
    };
  }

  // 更新接口需要显式传 null 才能清空可选字段，因此这里不能复用 create payload。
  function buildUpdateCustomerPayload(): UpdateCustomerPayload {
    return {
      name: normalizeRequiredText(customerForm.name),
      contactName: normalizeOptionalTextForUpdate(customerForm.contactName),
      phone: normalizeOptionalTextForUpdate(customerForm.phone),
      email: normalizeOptionalTextForUpdate(customerForm.email),
      source: normalizeOptionalTextForUpdate(customerForm.source),
      status: normalizeOptionalTextForUpdate(customerForm.status),
      ownerId: normalizeRequiredText(customerForm.ownerId),
      notes: normalizeOptionalTextForUpdate(customerForm.notes),
      tagIds: customerForm.tagIds.map((item) => item.trim()).filter(Boolean)
    };
  }

  function buildCreateTagPayload(): CreateCustomerTagPayload {
    return {
      name: normalizeRequiredText(tagForm.name),
      color: normalizeOptionalTextForCreate(tagForm.color)
    };
  }

  function buildTransferOwnerPayload(): TransferCustomerOwnerPayload {
    return {
      ownerId: normalizeRequiredText(ownerForm.ownerId)
    };
  }

  function buildFollowUpPayload(): CreateCustomerFollowUpPayload {
    return {
      content: normalizeRequiredText(followUpForm.content),
      nextFollowUpAt: normalizeOptionalTextForCreate(followUpForm.nextFollowUpAt)
    };
  }

  async function loadMeta(): Promise<void> {
    try {
      const data = await fetchCustomerMeta();

      users.value = data.users;
      tags.value = data.tags;
      sourceOptions.value = data.sourceOptions;
      statusOptions.value = data.statusOptions;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "客户基础数据加载失败，请稍后重试。"));
    }
  }

  async function loadCustomers(): Promise<void> {
    try {
      const data = await fetchCustomers(buildCustomerListQuery());

      customers.value = data.items;
      customerTableState.page = data.page;
      customerTableState.pageSize = data.pageSize;
      customerTableState.total = data.total;
      customerTableState.totalPages = data.totalPages;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "客户列表加载失败，请稍后重试。"));
    }
  }

  async function openCustomerDialog(customer?: Customer): Promise<void> {
    if (!customer) {
      resetCustomerForm();
    } else {
      customerForm.id = customer.id;
      customerForm.name = customer.name;
      customerForm.contactName = customer.contactName ?? "";
      customerForm.phone = customer.phone ?? "";
      customerForm.email = customer.email ?? "";
      customerForm.source = customer.source ?? "";
      customerForm.status = customer.status ?? "";
      customerForm.ownerId = customer.ownerId;
      customerForm.notes = customer.notes ?? "";
      customerForm.tagIds = customer.tags.map((item) => item.tag.id);
    }

    customerDialogVisible.value = true;
    await nextTick();
    customerFormRef.value?.clearValidate();
  }

  async function openTagDialog(): Promise<void> {
    resetTagForm();
    tagDialogVisible.value = true;
    await nextTick();
    tagFormRef.value?.clearValidate();
  }

  async function submitCustomer(): Promise<void> {
    const isValid = await validateForm(customerFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (customerForm.id) {
        await updateCustomer(customerForm.id, buildUpdateCustomerPayload());
      } else {
        await createCustomer(buildCreateCustomerPayload());
      }

      customerDialogVisible.value = false;
      ElMessage.success("客户已保存。");
      await loadCustomers();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "客户保存失败，请检查表单后重试。"));
    }
  }

  async function submitTag(): Promise<void> {
    const isValid = await validateForm(tagFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await createCustomerTag(buildCreateTagPayload());
      tagDialogVisible.value = false;
      resetTagForm();
      ElMessage.success("标签已创建。");
      await loadMeta();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "标签创建失败，请稍后重试。"));
    }
  }

  async function openOwnerDialog(customer: Customer): Promise<void> {
    selectedCustomer.value = customer;
    ownerForm.ownerId = customer.ownerId;
    ownerDialogVisible.value = true;
    await nextTick();
    ownerFormRef.value?.clearValidate();
  }

  async function submitOwner(): Promise<void> {
    const currentCustomer = selectedCustomer.value;

    if (!currentCustomer) {
      return;
    }

    const isValid = await validateForm(ownerFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await transferCustomerOwner(currentCustomer.id, buildTransferOwnerPayload());
      ownerDialogVisible.value = false;
      ElMessage.success("客户已转交。");
      await loadCustomers();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "客户转交失败，请稍后重试。"));
    }
  }

  async function openFollowUpDrawer(customer: Customer): Promise<void> {
    try {
      const [detail, followUpList] = await Promise.all([
        fetchCustomerDetail(customer.id),
        fetchCustomerFollowUps(customer.id)
      ]);

      selectedCustomer.value = detail;
      followUps.value = followUpList;
      followUpForm.content = "";
      followUpForm.nextFollowUpAt = "";
      followUpDrawerVisible.value = true;
      await nextTick();
      followUpFormRef.value?.clearValidate();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "客户跟进数据加载失败，请稍后重试。"));
    }
  }

  async function submitFollowUp(): Promise<void> {
    const currentCustomer = selectedCustomer.value;

    if (!currentCustomer) {
      return;
    }

    const isValid = await validateForm(followUpFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await createCustomerFollowUp(currentCustomer.id, buildFollowUpPayload());
      followUpForm.content = "";
      followUpForm.nextFollowUpAt = "";
      ElMessage.success("跟进已记录。");
      followUps.value = await fetchCustomerFollowUps(currentCustomer.id);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "跟进保存失败，请稍后重试。"));
    }
  }

  async function handleUploadAttachment(options: UploadRequestOptions): Promise<void> {
    await handleAttachmentUpload(options);
  }

  watch(
    () => [filters.keyword, filters.source, filters.status, filters.ownerId, filters.tagId],
    () => {
      customerTableState.page = 1;
      void loadCustomers();
    }
  );

  watch(
    () => customerTableState.sortPreset,
    (value) => {
      const nextSort = customerSortOptions.find((item) => item.value === value) ?? customerSortOptions[0];

      customerTableState.sortBy = nextSort.sortBy;
      customerTableState.sortOrder = nextSort.sortOrder;
      customerTableState.page = 1;
      void loadCustomers();
    }
  );

  function handleCustomerPageChange(page: number): void {
    customerTableState.page = page;
    void loadCustomers();
  }

  function handleCustomerPageSizeChange(pageSize: number): void {
    customerTableState.pageSize = pageSize;
    customerTableState.page = 1;
    void loadCustomers();
  }

  onMounted(async () => {
    await loadMeta();
    resetCustomerForm();
    await loadCustomers();
  });

  return {
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
    users,
    loadCustomers
  };
}
