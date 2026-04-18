/** 场景 composable：负责页面状态、请求编排和错误反馈策略的复用。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import {
  createDictionary,
  createIdentityConnector,
  createOpenApiCredential,
  createWebhookSubscription,
  fetchAuditLogs,
  fetchBatchTasks,
  fetchDictionaries,
  fetchIdentityConnectors,
  fetchOpenApiCredentials,
  fetchWebhookDeliveries,
  fetchWebhookSubscriptions,
  revokeOpenApiCredential,
  rotateOpenApiCredential,
  triggerWebhookTest,
  updateDictionary,
  updateIdentityConnector,
  updateWebhookSubscription
} from "@/api/system-administration.api";
import type { AuditLog } from "@/types/audit-logs";
import type { DictionaryEntry } from "@/types/dictionaries";
import type {
  AuditLogFilters,
  AuditLogTableState,
  BatchTaskFilters,
  BatchTaskRecord,
  DictionaryFormModel,
  IdentityConnectorFormModel,
  IdentityConnectorMatchField,
  IdentityConnectorRecord,
  IdentityConnectorType,
  OpenApiCredentialFormModel,
  OpenApiCredentialRecord,
  SaveDictionaryPayload,
  SecretRevealNotice,
  WebhookDeliveryRecord,
  WebhookSubscriptionFormModel,
  WebhookSubscriptionRecord,
  WebhookSubscriptionStatus
} from "@/types/system-administration";
import { normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const auditActionOptions = [
  "SIGN_IN",
  "SIGN_IN_FAILED",
  "ACCESS",
  "ACCESS_DENIED",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ENABLE",
  "DISABLE",
  "ASSIGN",
  "CONVERT",
  "UPLOAD",
  "WEBHOOK_DELIVERY",
  "WEBHOOK_DELIVERY_FAILED",
  "SESSION_REVOKE"
] as const;

const auditTargetTypeOptions = [
  "auth",
  "auth-session",
  "customer",
  "customer-tag",
  "customer-tags",
  "customer-followup",
  "lead",
  "lead-followup",
  "attachment",
  "open-api-credential",
  "webhook-subscription",
  "webhook-delivery",
  "identity-connector"
] as const;

const auditSortOptions = [
  { value: "createdAt:desc", label: "最新日志", sortBy: "createdAt", sortOrder: "desc" },
  { value: "actionType:asc", label: "动作升序", sortBy: "actionType", sortOrder: "asc" },
  { value: "targetType:asc", label: "对象类型升序", sortBy: "targetType", sortOrder: "asc" }
] as const;

const openApiScopeOptions = ["customer:read"] as const;
const webhookEventOptions = [
  "APPROVAL_COMPLETED",
  "REVENUE_PAYMENT_RECEIVED",
  "WORKFLOW_INSTANCE_COMPLETED",
  "GOVERNANCE_ALERT"
] as const;
const webhookStatusOptions = ["ACTIVE", "DISABLED"] as const;
const identityConnectorTypeOptions = ["SSO", "LDAP", "OAUTH"] as const satisfies readonly IdentityConnectorType[];
const identityConnectorMatchOptions = ["EMAIL", "USERNAME"] as const satisfies readonly IdentityConnectorMatchField[];
const identityConnectorStatusOptions = ["ACTIVE", "DISABLED"] as const;

function resolveGovernanceTone(hasAttention: boolean): "healthy" | "warning" {
  return hasAttention ? "warning" : "healthy";
}

function normalizeDateTimeInput(value: string): string | undefined {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return new Date(trimmedValue).toISOString();
}

function normalizeDomainText(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
}

export function useSystemAdministrationPage() {
  const dictionaryEntries = ref<DictionaryEntry[]>([]);
  const auditLogs = ref<AuditLog[]>([]);
  const batchTasks = ref<BatchTaskRecord[]>([]);
  const openApiCredentials = ref<OpenApiCredentialRecord[]>([]);
  const webhookSubscriptions = ref<WebhookSubscriptionRecord[]>([]);
  const webhookDeliveriesBySubscriptionId = ref<Record<string, WebhookDeliveryRecord[]>>({});
  const identityConnectors = ref<IdentityConnectorRecord[]>([]);

  const isDictionaryLoading = ref(true);
  const isAuditLoading = ref(true);
  const isAuditRefreshing = ref(false);
  const isBatchTaskLoading = ref(true);
  const isOpenIntegrationLoading = ref(true);

  const dictionaryDialogVisible = ref(false);
  const openApiDialogVisible = ref(false);
  const webhookDialogVisible = ref(false);
  const identityConnectorDialogVisible = ref(false);

  const dictionaryFormRef = ref<FormInstance>();
  const openApiFormRef = ref<FormInstance>();
  const webhookFormRef = ref<FormInstance>();
  const identityConnectorFormRef = ref<FormInstance>();

  const selectedBatchTask = ref<BatchTaskRecord | null>(null);
  const batchTaskDrawerVisible = ref(false);
  const secretRevealNotice = ref<SecretRevealNotice | null>(null);

  const dictionaryForm = reactive<DictionaryFormModel>({
    id: "",
    type: "",
    label: "",
    value: "",
    sort: 0,
    enabled: true
  });

  const openApiCredentialForm = reactive<OpenApiCredentialFormModel>({
    name: "",
    scopes: ["customer:read"],
    expiresAt: ""
  });

  const webhookSubscriptionForm = reactive<WebhookSubscriptionFormModel>({
    id: "",
    name: "",
    endpointUrl: "",
    eventTypes: ["GOVERNANCE_ALERT"],
    status: "ACTIVE",
    maxAttempts: 3,
    timeoutSeconds: 10,
    rotateSecret: false
  });

  const identityConnectorForm = reactive<IdentityConnectorFormModel>({
    id: "",
    name: "",
    type: "OAUTH",
    status: "ACTIVE",
    matchField: "EMAIL",
    issuerUrl: "",
    authorizeUrl: "",
    tokenUrl: "",
    directoryUrl: "",
    clientId: "",
    clientSecret: "",
    allowedDomainsText: "",
    configText: ""
  });

  const dictionaryRules: FormRules<DictionaryFormModel> = {
    type: [{ required: true, message: "请输入类型", trigger: "blur" }],
    label: [{ required: true, message: "请输入标签", trigger: "blur" }],
    value: [{ required: true, message: "请输入字典值", trigger: "blur" }]
  };

  const openApiCredentialRules: FormRules<OpenApiCredentialFormModel> = {
    name: [{ required: true, message: "请输入凭证名称", trigger: "blur" }],
    scopes: [{ required: true, message: "至少选择一个权限范围", trigger: "change" }]
  };

  const webhookSubscriptionRules: FormRules<WebhookSubscriptionFormModel> = {
    name: [{ required: true, message: "请输入订阅名称", trigger: "blur" }],
    endpointUrl: [{ required: true, message: "请输入回调地址", trigger: "blur" }],
    eventTypes: [{ required: true, message: "至少选择一个事件类型", trigger: "change" }]
  };

  const identityConnectorRules: FormRules<IdentityConnectorFormModel> = {
    name: [{ required: true, message: "请输入连接器名称", trigger: "blur" }]
  };

  const auditFilter = reactive<AuditLogFilters>({
    actorName: "",
    actionType: "",
    targetType: "",
    dateRange: null
  });

  const auditTableState = reactive<AuditLogTableState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
    sortPreset: "createdAt:desc"
  });

  const batchTaskFilters = reactive<BatchTaskFilters>({
    category: "",
    status: ""
  });

  const currentAuditSortLabel = computed(
    () => auditSortOptions.find((item) => item.value === auditTableState.sortPreset)?.label ?? "最新日志"
  );

  const isInitialLoading = computed(
    () =>
      (isDictionaryLoading.value ||
        isAuditLoading.value ||
        isBatchTaskLoading.value ||
        isOpenIntegrationLoading.value) &&
      dictionaryEntries.value.length === 0 &&
      auditLogs.value.length === 0
  );

  const visibleBatchTasks = computed(() => batchTasks.value);

  const governanceOverviewItems = computed(() => [
    {
      label: "批处理任务",
      value: batchTasks.value.length,
      tone: resolveGovernanceTone(batchTasks.value.some((item) => item.status === "FAILED"))
    },
    {
      label: "字典配置",
      value: dictionaryEntries.value.length,
      tone: "healthy" as const
    },
    {
      label: "审计日志",
      value: auditTableState.total,
      tone: "healthy" as const
    },
    {
      label: "开放接口凭证（API）",
      value: openApiCredentials.value.length,
      tone: resolveGovernanceTone(openApiCredentials.value.some((item) => item.status === "REVOKED"))
    },
    {
      label: "回调订阅",
      value: webhookSubscriptions.value.length,
      tone: resolveGovernanceTone(
        webhookSubscriptions.value.some(
          (item) => item.status === "DISABLED" || item.lastDeliveryStatus === "FAILED"
        )
      )
    },
    {
      label: "身份连接器",
      value: identityConnectors.value.length,
      tone: resolveGovernanceTone(
        identityConnectors.value.some((item) => item.status === "DISABLED" || Boolean(item.lastFailureMessage))
      )
    }
  ]);

  const batchTaskStatusOptions = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"] as const;
  const batchTaskCategoryOptions = ["IMPORT", "EXPORT"] as const;

  function setDictionaryFormRef(instance: FormInstance | undefined): void {
    dictionaryFormRef.value = instance;
  }

  function setOpenApiFormRef(instance: FormInstance | undefined): void {
    openApiFormRef.value = instance;
  }

  function setWebhookFormRef(instance: FormInstance | undefined): void {
    webhookFormRef.value = instance;
  }

  function setIdentityConnectorFormRef(instance: FormInstance | undefined): void {
    identityConnectorFormRef.value = instance;
  }

  function buildDictionaryPayload(): SaveDictionaryPayload {
    return {
      type: normalizeRequiredText(dictionaryForm.type),
      label: normalizeRequiredText(dictionaryForm.label),
      value: normalizeRequiredText(dictionaryForm.value),
      sort: dictionaryForm.sort,
      enabled: dictionaryForm.enabled
    };
  }

  async function loadDictionaries(): Promise<void> {
    isDictionaryLoading.value = true;

    try {
      dictionaryEntries.value = await fetchDictionaries();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "字典数据加载失败，请稍后重试。"));
    } finally {
      isDictionaryLoading.value = false;
    }
  }

  async function loadAuditLogs(): Promise<void> {
    const shouldShowSkeleton = auditLogs.value.length === 0;

    if (shouldShowSkeleton) {
      isAuditLoading.value = true;
    } else {
      isAuditRefreshing.value = true;
    }

    try {
      const [startDate, endDate] = auditFilter.dateRange ?? [];
      const data = await fetchAuditLogs({
        actorName: auditFilter.actorName || undefined,
        actionType: auditFilter.actionType || undefined,
        targetType: auditFilter.targetType || undefined,
        startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
        page: auditTableState.page,
        pageSize: auditTableState.pageSize,
        sortBy: auditTableState.sortBy,
        sortOrder: auditTableState.sortOrder
      });

      auditLogs.value = data.items;
      auditTableState.page = data.page;
      auditTableState.pageSize = data.pageSize;
      auditTableState.total = data.total;
      auditTableState.totalPages = data.totalPages;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "审计日志加载失败，请稍后重试。"));
    } finally {
      isAuditLoading.value = false;
      isAuditRefreshing.value = false;
    }
  }

  async function loadBatchTaskList(): Promise<void> {
    isBatchTaskLoading.value = true;

    try {
      batchTasks.value = await fetchBatchTasks({
        category: batchTaskFilters.category || undefined,
        status: batchTaskFilters.status || undefined
      });
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "批处理任务加载失败，请稍后重试。"));
    } finally {
      isBatchTaskLoading.value = false;
    }
  }

  async function loadOpenIntegrationResources(): Promise<void> {
    isOpenIntegrationLoading.value = true;

    try {
      const [credentials, subscriptions, connectors] = await Promise.all([
        fetchOpenApiCredentials(),
        fetchWebhookSubscriptions(),
        fetchIdentityConnectors()
      ]);

      openApiCredentials.value = credentials;
      webhookSubscriptions.value = subscriptions;
      identityConnectors.value = connectors;

      const deliveriesEntries = await Promise.all(
        subscriptions.map(async (item) => {
          try {
            return [item.id, await fetchWebhookDeliveries(item.id)] as const;
          } catch (error) {
            return [item.id, []] as const;
          }
        })
      );

      webhookDeliveriesBySubscriptionId.value = Object.fromEntries(deliveriesEntries);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "开放平台配置加载失败，请稍后重试。"));
    } finally {
      isOpenIntegrationLoading.value = false;
    }
  }

  async function openDictionaryDialog(entry?: DictionaryEntry): Promise<void> {
    dictionaryForm.id = entry?.id ?? "";
    dictionaryForm.type = entry?.type ?? "";
    dictionaryForm.label = entry?.label ?? "";
    dictionaryForm.value = entry?.value ?? "";
    dictionaryForm.sort = entry?.sort ?? 0;
    dictionaryForm.enabled = entry?.enabled ?? true;
    dictionaryDialogVisible.value = true;
    await nextTick();
    dictionaryFormRef.value?.clearValidate();
  }

  async function submitDictionary(): Promise<void> {
    const isValid = await validateForm(dictionaryFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (dictionaryForm.id) {
        await updateDictionary(dictionaryForm.id, buildDictionaryPayload());
      } else {
        await createDictionary(buildDictionaryPayload());
      }

      dictionaryDialogVisible.value = false;
      ElMessage.success("字典项已保存。");
      await loadDictionaries();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "字典项保存失败，请检查表单后重试。"));
    }
  }

  async function openOpenApiCredentialDialog(): Promise<void> {
    openApiCredentialForm.name = "";
    openApiCredentialForm.scopes = ["customer:read"];
    openApiCredentialForm.expiresAt = "";
    openApiDialogVisible.value = true;
    await nextTick();
    openApiFormRef.value?.clearValidate();
  }

  async function submitOpenApiCredential(): Promise<void> {
    const isValid = await validateForm(openApiFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      const created = await createOpenApiCredential({
        name: normalizeRequiredText(openApiCredentialForm.name),
        scopes: openApiCredentialForm.scopes,
        expiresAt: normalizeDateTimeInput(openApiCredentialForm.expiresAt)
      });
      secretRevealNotice.value = {
        type: "credential",
        label: created.name,
        secret: created.plainSecret ?? ""
      };
      openApiDialogVisible.value = false;
      ElMessage.success("开放接口凭证已创建。");
      await loadOpenIntegrationResources();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "开放接口凭证创建失败，请稍后重试。"));
    }
  }

  async function rotateOpenApiCredentialSecret(record: OpenApiCredentialRecord): Promise<void> {
    try {
      const rotated = await rotateOpenApiCredential(record.id);
      secretRevealNotice.value = {
        type: "credential",
        label: rotated.name,
        secret: rotated.plainSecret ?? ""
      };
      ElMessage.success("凭证密钥已轮换。");
      await loadOpenIntegrationResources();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "凭证轮换失败，请稍后重试。"));
    }
  }

  async function revokeOpenApiCredentialRecord(record: OpenApiCredentialRecord): Promise<void> {
    try {
      await revokeOpenApiCredential(record.id);
      ElMessage.success("凭证已撤销。");
      await loadOpenIntegrationResources();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "凭证撤销失败，请稍后重试。"));
    }
  }

  async function openWebhookSubscriptionDialog(record?: WebhookSubscriptionRecord): Promise<void> {
    webhookSubscriptionForm.id = record?.id ?? "";
    webhookSubscriptionForm.name = record?.name ?? "";
    webhookSubscriptionForm.endpointUrl = record?.endpointUrl ?? "";
    webhookSubscriptionForm.eventTypes = [...(record?.eventTypes ?? ["GOVERNANCE_ALERT"])];
    webhookSubscriptionForm.status = record?.status ?? "ACTIVE";
    webhookSubscriptionForm.maxAttempts = record?.maxAttempts ?? 3;
    webhookSubscriptionForm.timeoutSeconds = record?.timeoutSeconds ?? 10;
    webhookSubscriptionForm.rotateSecret = false;
    webhookDialogVisible.value = true;
    await nextTick();
    webhookFormRef.value?.clearValidate();
  }

  async function submitWebhookSubscription(): Promise<void> {
    const isValid = await validateForm(webhookFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      const payload = {
        name: normalizeRequiredText(webhookSubscriptionForm.name),
        endpointUrl: normalizeRequiredText(webhookSubscriptionForm.endpointUrl),
        eventTypes: webhookSubscriptionForm.eventTypes,
        status: webhookSubscriptionForm.status,
        maxAttempts: webhookSubscriptionForm.maxAttempts,
        timeoutSeconds: webhookSubscriptionForm.timeoutSeconds,
        rotateSecret: webhookSubscriptionForm.rotateSecret
      };

      const saved = webhookSubscriptionForm.id
        ? await updateWebhookSubscription(webhookSubscriptionForm.id, payload)
        : await createWebhookSubscription(payload);

      if (saved.plainSigningSecret) {
        secretRevealNotice.value = {
          type: "webhook",
          label: saved.name,
          secret: saved.plainSigningSecret
        };
      }

      webhookDialogVisible.value = false;
      ElMessage.success("回调订阅已保存。");
      await loadOpenIntegrationResources();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "回调订阅保存失败，请稍后重试。"));
    }
  }

  async function sendWebhookTest(record: WebhookSubscriptionRecord): Promise<void> {
    try {
      await triggerWebhookTest(record.id);
      ElMessage.success("测试投递已执行。");
      await loadOpenIntegrationResources();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "测试投递失败，请稍后重试。"));
    }
  }

  async function openIdentityConnectorDialog(record?: IdentityConnectorRecord): Promise<void> {
    identityConnectorForm.id = record?.id ?? "";
    identityConnectorForm.name = record?.name ?? "";
    identityConnectorForm.type = record?.type ?? "OAUTH";
    identityConnectorForm.status = record?.status ?? "ACTIVE";
    identityConnectorForm.matchField = record?.matchField ?? "EMAIL";
    identityConnectorForm.issuerUrl = record?.issuerUrl ?? "";
    identityConnectorForm.authorizeUrl = record?.authorizeUrl ?? "";
    identityConnectorForm.tokenUrl = record?.tokenUrl ?? "";
    identityConnectorForm.directoryUrl = record?.directoryUrl ?? "";
    identityConnectorForm.clientId = record?.clientId ?? "";
    identityConnectorForm.clientSecret = "";
    identityConnectorForm.allowedDomainsText = record?.allowedDomains.join(", ") ?? "";
    identityConnectorForm.configText = record?.config ? JSON.stringify(record.config, null, 2) : "";
    identityConnectorDialogVisible.value = true;
    await nextTick();
    identityConnectorFormRef.value?.clearValidate();
  }

  function parseIdentityConnectorConfig(): Record<string, unknown> | undefined {
    const trimmed = identityConnectorForm.configText.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = JSON.parse(trimmed);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("连接器配置必须为 JSON 对象。");
    }

    return parsed as Record<string, unknown>;
  }

  async function submitIdentityConnector(): Promise<void> {
    const isValid = await validateForm(identityConnectorFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      const payload = {
        name: normalizeRequiredText(identityConnectorForm.name),
        type: identityConnectorForm.type,
        status: identityConnectorForm.status,
        matchField: identityConnectorForm.matchField,
        issuerUrl: identityConnectorForm.issuerUrl.trim() || undefined,
        authorizeUrl: identityConnectorForm.authorizeUrl.trim() || undefined,
        tokenUrl: identityConnectorForm.tokenUrl.trim() || undefined,
        directoryUrl: identityConnectorForm.directoryUrl.trim() || undefined,
        clientId: identityConnectorForm.clientId.trim() || undefined,
        clientSecret: identityConnectorForm.clientSecret.trim() || undefined,
        allowedDomains: normalizeDomainText(identityConnectorForm.allowedDomainsText),
        config: parseIdentityConnectorConfig()
      };

      if (identityConnectorForm.id) {
        await updateIdentityConnector(identityConnectorForm.id, payload);
      } else {
        await createIdentityConnector(payload);
      }

      identityConnectorDialogVisible.value = false;
      ElMessage.success("身份连接器已保存。");
      await loadOpenIntegrationResources();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "身份连接器保存失败，请检查配置后重试。"));
    }
  }

  function openBatchTaskDrawer(task: BatchTaskRecord): void {
    selectedBatchTask.value = task;
    batchTaskDrawerVisible.value = true;
  }

  function closeBatchTaskDrawer(): void {
    batchTaskDrawerVisible.value = false;
    selectedBatchTask.value = null;
  }

  function resetBatchTaskFilters(): void {
    batchTaskFilters.category = "";
    batchTaskFilters.status = "";
  }

  watch(
    () => [auditFilter.actorName, auditFilter.actionType, auditFilter.targetType, ...(auditFilter.dateRange ?? [])],
    () => {
      auditTableState.page = 1;
      void loadAuditLogs();
    }
  );

  watch(
    () => auditTableState.sortPreset,
    (value) => {
      const nextSort = auditSortOptions.find((item) => item.value === value) ?? auditSortOptions[0];

      auditTableState.sortBy = nextSort.sortBy;
      auditTableState.sortOrder = nextSort.sortOrder;
      auditTableState.page = 1;
      void loadAuditLogs();
    }
  );

  watch(
    () => [batchTaskFilters.category, batchTaskFilters.status],
    () => {
      void loadBatchTaskList();
    }
  );

  function handleAuditPageChange(page: number): void {
    auditTableState.page = page;
    void loadAuditLogs();
  }

  function handleAuditPageSizeChange(pageSize: number): void {
    auditTableState.pageSize = pageSize;
    auditTableState.page = 1;
    void loadAuditLogs();
  }

  async function resetAuditFilters(): Promise<void> {
    const isAlreadyDefault =
      !auditFilter.actorName &&
      !auditFilter.actionType &&
      !auditFilter.targetType &&
      !auditFilter.dateRange &&
      auditTableState.sortPreset === auditSortOptions[0].value &&
      auditTableState.page === 1;

    auditFilter.actorName = "";
    auditFilter.actionType = "";
    auditFilter.targetType = "";
    auditFilter.dateRange = null;
    auditTableState.page = 1;
    auditTableState.sortPreset = auditSortOptions[0].value;

    if (isAlreadyDefault) {
      await loadAuditLogs();
    }
  }

  onMounted(() => {
    void Promise.all([
      loadDictionaries(),
      loadAuditLogs(),
      loadBatchTaskList(),
      loadOpenIntegrationResources()
    ]);
  });

  return {
    auditActionOptions,
    auditFilter,
    auditLogs,
    auditSortOptions,
    auditTableState,
    auditTargetTypeOptions,
    batchTaskCategoryOptions,
    batchTaskDrawerVisible,
    batchTaskFilters,
    batchTaskStatusOptions,
    closeBatchTaskDrawer,
    currentAuditSortLabel,
    dictionaryDialogVisible,
    dictionaryEntries,
    dictionaryForm,
    dictionaryRules,
    governanceOverviewItems,
    handleAuditPageChange,
    handleAuditPageSizeChange,
    identityConnectorDialogVisible,
    identityConnectorForm,
    identityConnectorRules,
    identityConnectorStatusOptions,
    identityConnectorTypeOptions,
    identityConnectorMatchOptions,
    identityConnectors,
    isAuditLoading,
    isAuditRefreshing,
    isInitialLoading,
    openApiCredentialDialogVisible: openApiDialogVisible,
    openApiCredentialForm,
    openApiCredentialRules,
    openApiCredentials,
    openApiScopeOptions,
    openBatchTaskDrawer,
    openDictionaryDialog,
    openIdentityConnectorDialog,
    openOpenApiCredentialDialog,
    openWebhookSubscriptionDialog,
    resetBatchTaskFilters,
    resetAuditFilters,
    revokeOpenApiCredentialRecord,
    rotateOpenApiCredentialSecret,
    secretRevealNotice,
    selectedBatchTask,
    sendWebhookTest,
    setDictionaryFormRef,
    setIdentityConnectorFormRef,
    setOpenApiFormRef,
    setWebhookFormRef,
    submitDictionary,
    submitIdentityConnector,
    submitOpenApiCredential,
    submitWebhookSubscription,
    visibleBatchTasks,
    webhookDeliveriesBySubscriptionId,
    webhookEventOptions,
    webhookStatusOptions,
    webhookSubscriptionDialogVisible: webhookDialogVisible,
    webhookSubscriptionForm,
    webhookSubscriptionRules,
    webhookSubscriptions
  };
}
