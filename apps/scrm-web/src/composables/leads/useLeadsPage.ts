/** 场景 composable：负责页面状态、请求编排和错误反馈策略的复用。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, UploadRequestOptions } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import {
  convertLeadToCustomer,
  createLead,
  createLeadFollowUp,
  fetchLeadDetail,
  fetchLeadFollowUps,
  fetchLeadMeta,
  fetchLeadReminders,
  fetchLeads,
  transferLeadOwner,
  updateLead
} from "@/api/leads.api";
import { useViewport } from "@/composables/useViewport";
import { useRecordUploads } from "@/composables/uploads/useRecordUploads";
import type { User } from "@/types/access-control";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { FollowUp, FollowUpFormModel, ReminderListItem } from "@/types/follow-ups";
import type {
  CreateLeadPayload,
  Lead,
  LeadFilters,
  LeadFormModel,
  LeadListQuery,
  LeadOwnerFormModel,
  LeadTableState,
  ReminderTableState,
  TransferLeadOwnerPayload,
  UpdateLeadPayload
} from "@/types/leads";
import { normalizeOptionalTextForCreate, normalizeOptionalTextForUpdate, normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const leadStatuses: Lead["status"][] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"];
const leadSortOptions = [
  { value: "createdAt:desc", label: "最新创建", sortBy: "createdAt", sortOrder: "desc" },
  { value: "updatedAt:desc", label: "最近更新", sortBy: "updatedAt", sortOrder: "desc" },
  { value: "name:asc", label: "名称 A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "status:asc", label: "状态升序", sortBy: "status", sortOrder: "asc" }
] as const;

export function useLeadsPage() {
  const leads = ref<Lead[]>([]);
  const users = ref<User[]>([]);
  const reminders = ref<ReminderListItem[]>([]);
  const sourceOptions = ref<DictionaryEntry[]>([]);
  const followUps = ref<FollowUp[]>([]);
  const isMetaLoading = ref(true);
  const isLeadTableLoading = ref(true);
  const isLeadTableRefreshing = ref(false);
  const isReminderLoading = ref(true);

  const leadDialogVisible = ref(false);
  const ownerDialogVisible = ref(false);
  const followUpDrawerVisible = ref(false);
  const selectedLead = ref<Lead | null>(null);

  const leadFormRef = ref<FormInstance>();
  const ownerFormRef = ref<FormInstance>();
  const followUpFormRef = ref<FormInstance>();

  const filters = reactive<LeadFilters>({
    keyword: "",
    source: "",
    status: "",
    ownerId: ""
  });

  const leadTableState = reactive<LeadTableState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
    sortPreset: "createdAt:desc"
  });

  const reminderTableState = reactive<ReminderTableState>({
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0
  });

  const leadForm = reactive<LeadFormModel>({
    id: "",
    name: "",
    contactName: "",
    phone: "",
    source: "",
    status: "NEW",
    ownerId: "",
    notes: ""
  });

  const ownerForm = reactive<LeadOwnerFormModel>({
    ownerId: ""
  });

  const followUpForm = reactive<FollowUpFormModel>({
    content: "",
    nextFollowUpAt: ""
  });

  const leadRules: FormRules<LeadFormModel> = {
    name: [
      { required: true, message: "请输入线索名称", trigger: "blur" },
      { min: 2, message: "线索名称至少需要 2 个字符", trigger: "blur" }
    ],
    ownerId: [{ required: true, message: "请选择归属人", trigger: "change" }]
  };

  const ownerRules: FormRules<LeadOwnerFormModel> = {
    ownerId: [{ required: true, message: "请选择新的归属人", trigger: "change" }]
  };

  const followUpRules: FormRules<FollowUpFormModel> = {
    content: [{ required: true, message: "请输入跟进内容", trigger: "blur" }]
  };

  const { isDesktop, isTabletOrDown } = useViewport();

  const currentLeadSortLabel = computed(
    () => leadSortOptions.find((item) => item.value === leadTableState.sortPreset)?.label ?? "最新创建"
  );

  const { attachments, handleUpload: handleAttachmentUpload } = useRecordUploads({
    getQuery: () =>
      selectedLead.value
        ? {
            businessType: "LEAD",
            businessId: selectedLead.value.id
          }
        : null
  });

  function setLeadFormRef(instance: FormInstance | undefined): void {
    leadFormRef.value = instance;
  }

  function setOwnerFormRef(instance: FormInstance | undefined): void {
    ownerFormRef.value = instance;
  }

  function setFollowUpFormRef(instance: FormInstance | undefined): void {
    followUpFormRef.value = instance;
  }

  function resetLeadForm(): void {
    leadForm.id = "";
    leadForm.name = "";
    leadForm.contactName = "";
    leadForm.phone = "";
    leadForm.source = "";
    leadForm.status = "NEW";
    leadForm.ownerId = users.value[0]?.id ?? "";
    leadForm.notes = "";
  }

  function buildLeadListQuery(): LeadListQuery {
    return {
      keyword: filters.keyword || undefined,
      source: filters.source || undefined,
      status: filters.status || undefined,
      ownerId: filters.ownerId || undefined,
      page: leadTableState.page,
      pageSize: leadTableState.pageSize,
      sortBy: leadTableState.sortBy,
      sortOrder: leadTableState.sortOrder
    };
  }

  function buildCreateLeadPayload(): CreateLeadPayload {
    return {
      name: normalizeRequiredText(leadForm.name),
      contactName: normalizeOptionalTextForCreate(leadForm.contactName),
      phone: normalizeOptionalTextForCreate(leadForm.phone),
      source: normalizeOptionalTextForCreate(leadForm.source),
      ownerId: normalizeRequiredText(leadForm.ownerId),
      notes: normalizeOptionalTextForCreate(leadForm.notes)
    };
  }

  function buildUpdateLeadPayload(): UpdateLeadPayload {
    return {
      name: normalizeRequiredText(leadForm.name),
      contactName: normalizeOptionalTextForUpdate(leadForm.contactName),
      phone: normalizeOptionalTextForUpdate(leadForm.phone),
      source: normalizeOptionalTextForUpdate(leadForm.source),
      // 状态在更新场景里允许被切回空值，因此这里仍然按 update/create 的空值语义拆开处理。
      status: normalizeOptionalTextForCreate(leadForm.status),
      ownerId: normalizeRequiredText(leadForm.ownerId),
      notes: normalizeOptionalTextForUpdate(leadForm.notes)
    };
  }

  function buildTransferOwnerPayload(): TransferLeadOwnerPayload {
    return {
      ownerId: normalizeRequiredText(ownerForm.ownerId)
    };
  }

  async function loadMeta(): Promise<void> {
    isMetaLoading.value = true;

    try {
      const data = await fetchLeadMeta();

      users.value = data.users;
      sourceOptions.value = data.sourceOptions;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索基础数据加载失败，请稍后重试。"));
    } finally {
      isMetaLoading.value = false;
    }
  }

  async function loadLeads(): Promise<void> {
    const shouldShowSkeleton = leads.value.length === 0;

    if (shouldShowSkeleton) {
      isLeadTableLoading.value = true;
    } else {
      isLeadTableRefreshing.value = true;
    }

    try {
      const data = await fetchLeads(buildLeadListQuery());

      leads.value = data.items;
      leadTableState.page = data.page;
      leadTableState.pageSize = data.pageSize;
      leadTableState.total = data.total;
      leadTableState.totalPages = data.totalPages;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索列表加载失败，请稍后重试。"));
    } finally {
      isLeadTableLoading.value = false;
      isLeadTableRefreshing.value = false;
    }
  }

  async function loadReminders(): Promise<void> {
    isReminderLoading.value = true;

    try {
      const data = await fetchLeadReminders(reminderTableState.page, reminderTableState.pageSize);

      reminders.value = data.items;
      reminderTableState.page = data.page;
      reminderTableState.pageSize = data.pageSize;
      reminderTableState.total = data.total;
      reminderTableState.totalPages = data.totalPages;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "提醒列表加载失败，请稍后重试。"));
    } finally {
      isReminderLoading.value = false;
    }
  }

  async function openLeadDialog(lead?: Lead): Promise<void> {
    if (!lead) {
      resetLeadForm();
    } else {
      leadForm.id = lead.id;
      leadForm.name = lead.name;
      leadForm.contactName = lead.contactName ?? "";
      leadForm.phone = lead.phone ?? "";
      leadForm.source = lead.source ?? "";
      leadForm.status = lead.status;
      leadForm.ownerId = lead.ownerId;
      leadForm.notes = lead.notes ?? "";
    }

    leadDialogVisible.value = true;
    await nextTick();
    leadFormRef.value?.clearValidate();
  }

  async function submitLead(): Promise<void> {
    const isValid = await validateForm(leadFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (leadForm.id) {
        await updateLead(leadForm.id, buildUpdateLeadPayload());
      } else {
        await createLead(buildCreateLeadPayload());
      }

      leadDialogVisible.value = false;
      ElMessage.success("线索已保存。");
      await Promise.all([loadLeads(), loadReminders()]);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索保存失败，请检查表单后重试。"));
    }
  }

  async function openOwnerDialog(lead: Lead): Promise<void> {
    selectedLead.value = lead;
    ownerForm.ownerId = lead.ownerId;
    ownerDialogVisible.value = true;
    await nextTick();
    ownerFormRef.value?.clearValidate();
  }

  async function submitOwner(): Promise<void> {
    const currentLead = selectedLead.value;

    if (!currentLead) {
      return;
    }

    const isValid = await validateForm(ownerFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await transferLeadOwner(currentLead.id, buildTransferOwnerPayload());
      ownerDialogVisible.value = false;
      ElMessage.success("线索分配已更新。");
      await loadLeads();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索分配失败，请稍后重试。"));
    }
  }

  async function convertLead(lead: Lead): Promise<void> {
    try {
      await convertLeadToCustomer(lead.id);
      ElMessage.success("线索已成功转为客户。");
      await Promise.all([loadLeads(), loadReminders()]);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索转客户失败，请稍后重试。"));
    }
  }

  async function openFollowUpDrawer(lead: Lead): Promise<void> {
    try {
      // 明细和跟进列表并行加载，避免抽屉打开后先展示半套旧数据、再闪烁更新。
      const [detail, followUpList] = await Promise.all([
        fetchLeadDetail(lead.id),
        fetchLeadFollowUps(lead.id)
      ]);

      selectedLead.value = detail;
      followUps.value = followUpList;
      followUpForm.content = "";
      followUpForm.nextFollowUpAt = "";
      followUpDrawerVisible.value = true;
      await nextTick();
      // 抽屉复用表单实例时必须清掉历史校验状态，否则会把上一条线索的报错带进来。
      followUpFormRef.value?.clearValidate();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索跟进数据加载失败，请稍后重试。"));
    }
  }

  async function submitFollowUp(): Promise<void> {
    const currentLead = selectedLead.value;

    if (!currentLead) {
      return;
    }

    const isValid = await validateForm(followUpFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await createLeadFollowUp(currentLead.id, {
        content: normalizeRequiredText(followUpForm.content),
        nextFollowUpAt: normalizeOptionalTextForCreate(followUpForm.nextFollowUpAt)
      });

      followUpForm.content = "";
      followUpForm.nextFollowUpAt = "";
      ElMessage.success("线索跟进已保存。");
      followUps.value = await fetchLeadFollowUps(currentLead.id);
      await loadReminders();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "线索跟进保存失败，请稍后重试。"));
    }
  }

  async function handleUploadAttachment(options: UploadRequestOptions): Promise<void> {
    await handleAttachmentUpload(options);
  }

  watch(
    () => [filters.keyword, filters.source, filters.status, filters.ownerId],
    () => {
      leadTableState.page = 1;
      void loadLeads();
    }
  );

  watch(
    () => leadTableState.sortPreset,
    (value) => {
      const nextSort = leadSortOptions.find((item) => item.value === value) ?? leadSortOptions[0];

      leadTableState.sortBy = nextSort.sortBy;
      leadTableState.sortOrder = nextSort.sortOrder;
      leadTableState.page = 1;
      void loadLeads();
    }
  );

  function handleLeadPageChange(page: number): void {
    leadTableState.page = page;
    void loadLeads();
  }

  function handleLeadPageSizeChange(pageSize: number): void {
    leadTableState.pageSize = pageSize;
    leadTableState.page = 1;
    void loadLeads();
  }

  function handleReminderPageChange(page: number): void {
    reminderTableState.page = page;
    void loadReminders();
  }

  async function resetLeadFilters(): Promise<void> {
    const isAlreadyDefault =
      !filters.keyword &&
      !filters.source &&
      !filters.status &&
      !filters.ownerId &&
      leadTableState.sortPreset === leadSortOptions[0].value &&
      leadTableState.page === 1;

    filters.keyword = "";
    filters.source = "";
    filters.status = "";
    filters.ownerId = "";
    leadTableState.page = 1;
    leadTableState.sortPreset = leadSortOptions[0].value;

    if (isAlreadyDefault) {
      await loadLeads();
    }
  }

  async function resetReminders(): Promise<void> {
    reminderTableState.page = 1;
    await loadReminders();
  }

  onMounted(async () => {
    await loadMeta();
    resetLeadForm();
    await Promise.all([loadLeads(), loadReminders()]);
  });

  return {
    attachments,
    currentLeadSortLabel,
    convertLead,
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
    isLeadTableLoading,
    isLeadTableRefreshing,
    isMetaLoading,
    isReminderLoading,
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
    resetLeadFilters,
    resetReminders,
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
  };
}
