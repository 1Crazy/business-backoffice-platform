import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import {
  createDictionary,
  fetchAuditLogs,
  fetchDictionaries,
  updateDictionary
} from "@/api/system-administration.api";
import type { AuditLog } from "@/types/audit-logs";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { SaveDictionaryPayload } from "@/types/system-administration";
import type {
  AuditLogFilters,
  AuditLogTableState,
  DictionaryFormModel
} from "@/types/system-administration";
import { normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const auditActionOptions = [
  "SIGN_IN",
  "SIGN_IN_FAILED",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ENABLE",
  "DISABLE",
  "ASSIGN",
  "CONVERT",
  "UPLOAD",
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
  "attachment"
] as const;

const auditSortOptions = [
  { value: "createdAt:desc", label: "最新日志", sortBy: "createdAt", sortOrder: "desc" },
  { value: "actionType:asc", label: "动作升序", sortBy: "actionType", sortOrder: "asc" },
  { value: "targetType:asc", label: "对象类型升序", sortBy: "targetType", sortOrder: "asc" }
] as const;

export function useSystemAdministrationPage() {
  const dictionaryEntries = ref<DictionaryEntry[]>([]);
  const auditLogs = ref<AuditLog[]>([]);

  const dictionaryDialogVisible = ref(false);
  const dictionaryFormRef = ref<FormInstance>();

  const dictionaryForm = reactive<DictionaryFormModel>({
    id: "",
    type: "",
    label: "",
    value: "",
    sort: 0,
    enabled: true
  });

  const dictionaryRules: FormRules<DictionaryFormModel> = {
    type: [{ required: true, message: "请输入类型", trigger: "blur" }],
    label: [{ required: true, message: "请输入标签", trigger: "blur" }],
    value: [{ required: true, message: "请输入字典值", trigger: "blur" }]
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

  const currentAuditSortLabel = computed(
    () => auditSortOptions.find((item) => item.value === auditTableState.sortPreset)?.label ?? "最新日志"
  );

  function setDictionaryFormRef(instance: FormInstance | undefined): void {
    dictionaryFormRef.value = instance;
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
    try {
      dictionaryEntries.value = await fetchDictionaries();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "字典数据加载失败，请稍后重试。"));
    }
  }

  async function loadAuditLogs(): Promise<void> {
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

  function handleAuditPageChange(page: number): void {
    auditTableState.page = page;
    void loadAuditLogs();
  }

  function handleAuditPageSizeChange(pageSize: number): void {
    auditTableState.pageSize = pageSize;
    auditTableState.page = 1;
    void loadAuditLogs();
  }

  onMounted(() => {
    void Promise.all([loadDictionaries(), loadAuditLogs()]);
  });

  return {
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
  };
}
