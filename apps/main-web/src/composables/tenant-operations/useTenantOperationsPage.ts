import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref } from "vue";

import {
  archiveTenant,
  createTenant,
  disableTenant,
  enableTenant,
  fetchTenants,
  updateTenantQuotas
} from "@/api/tenant-operations.api";
import type {
  CreateTenantPayload,
  TenantCreateFormModel,
  TenantLifecycleStatus,
  TenantOperationsSnapshot,
  TenantQuotaFormModel,
  TenantRuntimeStatus,
  UpdateTenantQuotasPayload
} from "@/types/tenant-operations";
import { normalizeOptionalTextForCreate, normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

export function useTenantOperationsPage() {
  const tenants = ref<TenantOperationsSnapshot[]>([]);
  const isLoading = ref(true);
  const isSubmitting = ref(false);
  const createDialogVisible = ref(false);
  const quotaDialogVisible = ref(false);
  const createFormRef = ref<FormInstance>();
  const quotaFormRef = ref<FormInstance>();
  const activeTenantId = ref("");
  const keyword = ref("");
  const lifecycleFilter = ref<TenantLifecycleStatus | "">("");
  const runtimeFilter = ref<TenantRuntimeStatus | "">("");

  const createForm = reactive<TenantCreateFormModel>({
    code: "",
    name: "",
    industry: "",
    planName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    adminUsername: "",
    adminDisplayName: "",
    adminPassword: "",
    userQuota: 50,
    storageQuotaMb: 5120,
    monthlyTaskQuota: 10000
  });

  const quotaForm = reactive<TenantQuotaFormModel>({
    tenantId: "",
    tenantName: "",
    userQuota: 50,
    storageQuotaMb: 5120,
    monthlyTaskQuota: 10000
  });

  const createRules: FormRules<TenantCreateFormModel> = {
    code: [{ required: true, message: "请输入租户编码", trigger: "blur" }],
    name: [{ required: true, message: "请输入租户名称", trigger: "blur" }],
    ownerName: [{ required: true, message: "请输入负责人姓名", trigger: "blur" }],
    ownerEmail: [{ required: true, message: "请输入负责人邮箱", trigger: "blur" }],
    adminUsername: [{ required: true, message: "请输入管理员账号", trigger: "blur" }],
    adminDisplayName: [{ required: true, message: "请输入管理员姓名", trigger: "blur" }],
    adminPassword: [{ required: true, message: "请输入管理员密码", trigger: "blur" }]
  };

  const quotaRules: FormRules<TenantQuotaFormModel> = {
    userQuota: [{ required: true, message: "请输入用户配额", trigger: "change" }],
    storageQuotaMb: [{ required: true, message: "请输入存储配额", trigger: "change" }],
    monthlyTaskQuota: [{ required: true, message: "请输入任务配额", trigger: "change" }]
  };

  const lifecycleOptions = ["ACTIVE", "DISABLED", "ARCHIVED"] as const;
  const runtimeOptions = ["HEALTHY", "WARNING", "ERROR"] as const;

  const visibleTenants = computed(() => {
    const normalizedKeyword = keyword.value.trim().toLowerCase();

    return tenants.value.filter((tenant) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [tenant.name, tenant.code, tenant.ownerName, tenant.ownerEmail, tenant.planName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedKeyword));
      const matchesLifecycle = !lifecycleFilter.value || tenant.lifecycleStatus === lifecycleFilter.value;
      const matchesRuntime = !runtimeFilter.value || tenant.runtimeStatus === runtimeFilter.value;

      return matchesKeyword && matchesLifecycle && matchesRuntime;
    });
  });

  const selectedTenant = computed(
    () => visibleTenants.value.find((tenant) => tenant.id === activeTenantId.value) ?? visibleTenants.value[0] ?? null
  );

  const summaryItems = computed(() => [
    {
      label: "租户总数",
      value: tenants.value.length,
      tone: "neutral"
    },
    {
      label: "需关注",
      value: tenants.value.filter((tenant) => tenant.runtimeStatus !== "HEALTHY").length,
      tone: "warning"
    },
    {
      label: "已停用 / 已归档",
      value: tenants.value.filter((tenant) => tenant.lifecycleStatus !== "ACTIVE").length,
      tone: "muted"
    },
    {
      label: "配额高压",
      value: tenants.value.filter((tenant) => tenant.runtimeHighlights.some((item) => item.includes("接近上限") || item.includes("已满"))).length,
      tone: "warning"
    }
  ]);

  function setCreateFormRef(instance: FormInstance | undefined): void {
    createFormRef.value = instance;
  }

  function setQuotaFormRef(instance: FormInstance | undefined): void {
    quotaFormRef.value = instance;
  }

  async function loadTenants(): Promise<void> {
    isLoading.value = true;

    try {
      tenants.value = await fetchTenants();
      activeTenantId.value = selectedTenant.value?.id ?? tenants.value[0]?.id ?? "";
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "租户运营数据加载失败，请稍后重试。"));
    } finally {
      isLoading.value = false;
    }
  }

  async function openCreateDialog(): Promise<void> {
    createForm.code = "";
    createForm.name = "";
    createForm.industry = "";
    createForm.planName = "";
    createForm.ownerName = "";
    createForm.ownerEmail = "";
    createForm.ownerPhone = "";
    createForm.adminUsername = "";
    createForm.adminDisplayName = "";
    createForm.adminPassword = "";
    createForm.userQuota = 50;
    createForm.storageQuotaMb = 5120;
    createForm.monthlyTaskQuota = 10000;
    createDialogVisible.value = true;
    await nextTick();
    createFormRef.value?.clearValidate();
  }

  function closeCreateDialog(): void {
    createDialogVisible.value = false;
  }

  function handleCreateDialogClosed(): void {
    createFormRef.value?.clearValidate();
  }

  function selectTenant(tenant: TenantOperationsSnapshot): void {
    activeTenantId.value = tenant.id;
  }

  function buildCreatePayload(): CreateTenantPayload {
    return {
      code: normalizeRequiredText(createForm.code).toLowerCase(),
      name: normalizeRequiredText(createForm.name),
      industry: normalizeOptionalTextForCreate(createForm.industry),
      planName: normalizeOptionalTextForCreate(createForm.planName),
      ownerName: normalizeRequiredText(createForm.ownerName),
      ownerEmail: normalizeRequiredText(createForm.ownerEmail),
      ownerPhone: normalizeOptionalTextForCreate(createForm.ownerPhone),
      adminUsername: normalizeRequiredText(createForm.adminUsername),
      adminDisplayName: normalizeRequiredText(createForm.adminDisplayName),
      adminPassword: normalizeRequiredText(createForm.adminPassword),
      userQuota: createForm.userQuota,
      storageQuotaMb: createForm.storageQuotaMb,
      monthlyTaskQuota: createForm.monthlyTaskQuota
    };
  }

  function buildQuotaPayload(): UpdateTenantQuotasPayload {
    return {
      userQuota: quotaForm.userQuota,
      storageQuotaMb: quotaForm.storageQuotaMb,
      monthlyTaskQuota: quotaForm.monthlyTaskQuota
    };
  }

  async function submitCreate(): Promise<void> {
    const isValid = await validateForm(createFormRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await createTenant(buildCreatePayload());
      ElMessage.success("租户已创建并完成基础初始化。");
      createDialogVisible.value = false;
      await loadTenants();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "租户创建失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  async function openQuotaDialog(tenant: TenantOperationsSnapshot): Promise<void> {
    quotaForm.tenantId = tenant.id;
    quotaForm.tenantName = tenant.name;
    quotaForm.userQuota = tenant.quotas.users;
    quotaForm.storageQuotaMb = tenant.quotas.storageQuotaMb;
    quotaForm.monthlyTaskQuota = tenant.quotas.monthlyTasks;
    quotaDialogVisible.value = true;
    await nextTick();
    quotaFormRef.value?.clearValidate();
  }

  function closeQuotaDialog(): void {
    quotaDialogVisible.value = false;
  }

  function handleQuotaDialogClosed(): void {
    quotaFormRef.value?.clearValidate();
  }

  async function submitQuotaUpdate(): Promise<void> {
    const isValid = await validateForm(quotaFormRef.value);

    if (!isValid || !quotaForm.tenantId) {
      return;
    }

    isSubmitting.value = true;

    try {
      await updateTenantQuotas(quotaForm.tenantId, buildQuotaPayload());
      ElMessage.success("租户配额已更新。");
      quotaDialogVisible.value = false;
      await loadTenants();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "租户配额更新失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  async function changeLifecycle(tenant: TenantOperationsSnapshot, action: "enable" | "disable" | "archive"): Promise<void> {
    isSubmitting.value = true;

    try {
      if (action === "enable") {
        await enableTenant(tenant.id);
      } else if (action === "disable") {
        await disableTenant(tenant.id);
      } else {
        await archiveTenant(tenant.id);
      }

      ElMessage.success("租户生命周期状态已更新。");
      await loadTenants();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "租户生命周期更新失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  onMounted(() => {
    void loadTenants();
  });

  return {
    createDialogVisible,
    createForm,
    createRules,
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
    changeLifecycle,
    closeCreateDialog,
    closeQuotaDialog,
    handleCreateDialogClosed,
    handleQuotaDialogClosed,
    visibleTenants
  };
}
