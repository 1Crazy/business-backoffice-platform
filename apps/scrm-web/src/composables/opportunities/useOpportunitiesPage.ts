/** 场景 composable：负责页面状态、请求编排和错误反馈策略的复用。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import {
  advanceOpportunityStage,
  createOpportunity,
  fetchOpportunityDetail,
  fetchOpportunityMeta,
  fetchOpportunities,
  markOpportunityLost,
  markOpportunityWon,
  transferOpportunityOwner,
  updateOpportunity
} from "@/api/opportunities.api";
import { useViewport } from "@/composables/useViewport";
import type { User } from "@/types/access-control";
import type {
  AdvanceOpportunityStagePayload,
  CreateOpportunityPayload,
  MarkOpportunityLostPayload,
  MarkOpportunityWonPayload,
  Opportunity,
  OpportunityCloseFormModel,
  OpportunityFilters,
  OpportunityFormModel,
  OpportunityListQuery,
  OpportunityOwnerFormModel,
  OpportunityResultStatus,
  OpportunityStage,
  OpportunityStageFormModel,
  OpportunityTableState,
  TransferOpportunityOwnerPayload,
  UpdateOpportunityPayload
} from "@/types/opportunities";
import { normalizeOptionalTextForCreate, normalizeOptionalTextForUpdate, normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const opportunityStageOptions: Array<{ value: OpportunityStage; label: string }> = [
  { value: "DISCOVERY", label: "需求发现" },
  { value: "QUALIFICATION", label: "机会确认" },
  { value: "PROPOSAL", label: "方案提报" },
  { value: "NEGOTIATION", label: "商务谈判" },
  { value: "CLOSED_WON", label: "赢单" },
  { value: "CLOSED_LOST", label: "输单" }
];

const inProgressStageOptions = opportunityStageOptions.filter(
  (item) => item.value !== "CLOSED_WON" && item.value !== "CLOSED_LOST"
);

const opportunityResultOptions: Array<{ value: OpportunityResultStatus; label: string }> = [
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "WON", label: "赢单" },
  { value: "LOST", label: "输单" }
];

const opportunitySortOptions = [
  { value: "createdAt:desc", label: "最新创建", sortBy: "createdAt", sortOrder: "desc" },
  { value: "updatedAt:desc", label: "最近更新", sortBy: "updatedAt", sortOrder: "desc" },
  { value: "expectedCloseDate:asc", label: "预计成交最早", sortBy: "expectedCloseDate", sortOrder: "asc" },
  { value: "expectedAmount:desc", label: "金额从高到低", sortBy: "expectedAmount", sortOrder: "desc" }
] as const;

export function useOpportunitiesPage() {
  const opportunities = ref<Opportunity[]>([]);
  const users = ref<User[]>([]);
  const customers = ref<Array<{ id: string; name: string }>>([]);
  const leads = ref<Array<{ id: string; name: string }>>([]);
  const selectedOpportunity = ref<Opportunity | null>(null);
  const isMetaLoading = ref(true);
  const isTableLoading = ref(true);
  const isTableRefreshing = ref(false);

  const opportunityDialogVisible = ref(false);
  const ownerDialogVisible = ref(false);
  const stageDialogVisible = ref(false);
  const closeDialogVisible = ref(false);
  const detailDrawerVisible = ref(false);
  const closeMode = ref<"WON" | "LOST">("WON");

  const opportunityFormRef = ref<FormInstance>();
  const ownerFormRef = ref<FormInstance>();
  const stageFormRef = ref<FormInstance>();
  const closeFormRef = ref<FormInstance>();

  const filters = reactive<OpportunityFilters>({
    keyword: "",
    customerId: "",
    ownerId: "",
    stage: "",
    resultStatus: "",
    expectedCloseDateRange: [],
    closedAtRange: []
  });

  const opportunityTableState = reactive<OpportunityTableState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
    sortPreset: "createdAt:desc"
  });

  const opportunityForm = reactive<OpportunityFormModel>({
    id: "",
    name: "",
    customerId: "",
    sourceLeadId: "",
    ownerId: "",
    stage: "DISCOVERY",
    expectedAmount: null,
    expectedCloseDate: "",
    nextAction: "",
    notes: ""
  });

  const ownerForm = reactive<OpportunityOwnerFormModel>({
    ownerId: ""
  });

  const stageForm = reactive<OpportunityStageFormModel>({
    stage: "QUALIFICATION",
    comment: ""
  });

  const closeForm = reactive<OpportunityCloseFormModel>({
    lostReason: "",
    comment: ""
  });

  const opportunityRules: FormRules<OpportunityFormModel> = {
    name: [
      { required: true, message: "请输入商机名称", trigger: "blur" },
      { min: 2, message: "商机名称至少需要 2 个字符", trigger: "blur" }
    ],
    customerId: [{ required: true, message: "请选择关联客户", trigger: "change" }],
    ownerId: [{ required: true, message: "请选择归属人", trigger: "change" }],
    expectedAmount: [
      {
        validator: (_rule, value, callback) => {
          if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
            callback(new Error("请输入有效的预计金额"));
            return;
          }

          callback();
        },
        trigger: "change"
      }
    ],
    expectedCloseDate: [{ required: true, message: "请选择预计成交时间", trigger: "change" }],
    nextAction: [{ required: true, message: "请输入下一步动作", trigger: "blur" }]
  };

  const ownerRules: FormRules<OpportunityOwnerFormModel> = {
    ownerId: [{ required: true, message: "请选择新的归属人", trigger: "change" }]
  };

  const stageRules: FormRules<OpportunityStageFormModel> = {
    stage: [{ required: true, message: "请选择目标阶段", trigger: "change" }]
  };

  const closeRules = computed<FormRules<OpportunityCloseFormModel>>(() =>
    closeMode.value === "LOST"
      ? {
          lostReason: [{ required: true, message: "请输入输单原因", trigger: "blur" }]
        }
      : {}
  );

  const currentOpportunitySortLabel = computed(
    () =>
      opportunitySortOptions.find((item) => item.value === opportunityTableState.sortPreset)?.label ?? "最新创建"
  );

  const stageDialogOptions = computed(() =>
    inProgressStageOptions.filter((item) => item.value !== selectedOpportunity.value?.stage)
  );

  const { isTabletOrDown } = useViewport();

  function setOpportunityFormRef(instance: FormInstance | undefined): void {
    opportunityFormRef.value = instance;
  }

  function setOwnerFormRef(instance: FormInstance | undefined): void {
    ownerFormRef.value = instance;
  }

  function setStageFormRef(instance: FormInstance | undefined): void {
    stageFormRef.value = instance;
  }

  function setCloseFormRef(instance: FormInstance | undefined): void {
    closeFormRef.value = instance;
  }

  function resetOpportunityForm(): void {
    opportunityForm.id = "";
    opportunityForm.name = "";
    opportunityForm.customerId = customers.value[0]?.id ?? "";
    opportunityForm.sourceLeadId = "";
    opportunityForm.ownerId = users.value[0]?.id ?? "";
    opportunityForm.stage = "DISCOVERY";
    opportunityForm.expectedAmount = null;
    opportunityForm.expectedCloseDate = "";
    opportunityForm.nextAction = "";
    opportunityForm.notes = "";
  }

  function buildOpportunityListQuery(): OpportunityListQuery {
    const [expectedCloseDateStart, expectedCloseDateEnd] = filters.expectedCloseDateRange;
    const [closedAtStart, closedAtEnd] = filters.closedAtRange;

    return {
      keyword: filters.keyword || undefined,
      customerId: filters.customerId || undefined,
      ownerId: filters.ownerId || undefined,
      stage: filters.stage || undefined,
      resultStatus: filters.resultStatus || undefined,
      expectedCloseDateStart,
      expectedCloseDateEnd,
      closedAtStart,
      closedAtEnd,
      page: opportunityTableState.page,
      pageSize: opportunityTableState.pageSize,
      sortBy: opportunityTableState.sortBy,
      sortOrder: opportunityTableState.sortOrder
    };
  }

  function buildCreateOpportunityPayload(): CreateOpportunityPayload {
    return {
      name: normalizeRequiredText(opportunityForm.name),
      customerId: normalizeRequiredText(opportunityForm.customerId),
      sourceLeadId: normalizeOptionalTextForCreate(opportunityForm.sourceLeadId),
      ownerId: normalizeRequiredText(opportunityForm.ownerId),
      stage: opportunityForm.stage,
      expectedAmount: opportunityForm.expectedAmount ?? 0,
      expectedCloseDate: normalizeRequiredText(opportunityForm.expectedCloseDate),
      nextAction: normalizeRequiredText(opportunityForm.nextAction),
      notes: normalizeOptionalTextForCreate(opportunityForm.notes)
    };
  }

  function buildUpdateOpportunityPayload(): UpdateOpportunityPayload {
    return {
      name: normalizeRequiredText(opportunityForm.name),
      sourceLeadId: normalizeOptionalTextForUpdate(opportunityForm.sourceLeadId),
      ownerId: normalizeRequiredText(opportunityForm.ownerId),
      expectedAmount: opportunityForm.expectedAmount ?? 0,
      expectedCloseDate: normalizeRequiredText(opportunityForm.expectedCloseDate),
      nextAction: normalizeRequiredText(opportunityForm.nextAction),
      notes: normalizeOptionalTextForUpdate(opportunityForm.notes)
    };
  }

  function buildTransferOwnerPayload(): TransferOpportunityOwnerPayload {
    return {
      ownerId: normalizeRequiredText(ownerForm.ownerId)
    };
  }

  function buildAdvanceStagePayload(): AdvanceOpportunityStagePayload {
    return {
      stage: stageForm.stage,
      comment: normalizeOptionalTextForCreate(stageForm.comment)
    };
  }

  function buildWonPayload(): MarkOpportunityWonPayload {
    return {
      comment: normalizeOptionalTextForCreate(closeForm.comment)
    };
  }

  function buildLostPayload(): MarkOpportunityLostPayload {
    return {
      lostReason: normalizeRequiredText(closeForm.lostReason),
      comment: normalizeOptionalTextForCreate(closeForm.comment)
    };
  }

  async function loadMeta(): Promise<void> {
    isMetaLoading.value = true;

    try {
      const data = await fetchOpportunityMeta();

      users.value = data.users;
      customers.value = data.customers;
      leads.value = data.leads;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "商机基础数据加载失败，请稍后重试。"));
    } finally {
      isMetaLoading.value = false;
    }
  }

  async function loadOpportunities(): Promise<void> {
    const shouldShowSkeleton = opportunities.value.length === 0;

    if (shouldShowSkeleton) {
      isTableLoading.value = true;
    } else {
      isTableRefreshing.value = true;
    }

    try {
      const data = await fetchOpportunities(buildOpportunityListQuery());

      opportunities.value = data.items;
      opportunityTableState.page = data.page;
      opportunityTableState.pageSize = data.pageSize;
      opportunityTableState.total = data.total;
      opportunityTableState.totalPages = data.totalPages;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "商机列表加载失败，请稍后重试。"));
    } finally {
      isTableLoading.value = false;
      isTableRefreshing.value = false;
    }
  }

  async function openOpportunityDialog(opportunity?: Opportunity): Promise<void> {
    if (!opportunity) {
      resetOpportunityForm();
    } else {
      opportunityForm.id = opportunity.id;
      opportunityForm.name = opportunity.name;
      opportunityForm.customerId = opportunity.customerId;
      opportunityForm.sourceLeadId = opportunity.sourceLeadId ?? "";
      opportunityForm.ownerId = opportunity.ownerId;
      opportunityForm.stage = opportunity.stage;
      opportunityForm.expectedAmount = opportunity.expectedAmount;
      opportunityForm.expectedCloseDate = opportunity.expectedCloseDate;
      opportunityForm.nextAction = opportunity.nextAction;
      opportunityForm.notes = opportunity.notes ?? "";
    }

    opportunityDialogVisible.value = true;
    await nextTick();
    opportunityFormRef.value?.clearValidate();
  }

  async function submitOpportunity(): Promise<void> {
    const isValid = await validateForm(opportunityFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (opportunityForm.id) {
        await updateOpportunity(opportunityForm.id, buildUpdateOpportunityPayload());
      } else {
        await createOpportunity(buildCreateOpportunityPayload());
      }

      opportunityDialogVisible.value = false;
      ElMessage.success("商机已保存。");
      await Promise.all([loadOpportunities(), refreshSelectedOpportunity()]);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "商机保存失败，请检查表单后重试。"));
    }
  }

  async function openOwnerDialog(opportunity: Opportunity): Promise<void> {
    selectedOpportunity.value = opportunity;
    ownerForm.ownerId = opportunity.ownerId;
    ownerDialogVisible.value = true;
    await nextTick();
    ownerFormRef.value?.clearValidate();
  }

  async function submitOwner(): Promise<void> {
    const currentOpportunity = selectedOpportunity.value;

    if (!currentOpportunity) {
      return;
    }

    const isValid = await validateForm(ownerFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await transferOpportunityOwner(currentOpportunity.id, buildTransferOwnerPayload());
      ownerDialogVisible.value = false;
      ElMessage.success("商机负责人已更新。");
      await Promise.all([loadOpportunities(), refreshSelectedOpportunity()]);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "商机分配失败，请稍后重试。"));
    }
  }

  async function openStageDialog(opportunity: Opportunity): Promise<void> {
    selectedOpportunity.value = opportunity;
    stageForm.stage =
      inProgressStageOptions.find((item) => item.value !== opportunity.stage)?.value ?? "QUALIFICATION";
    stageForm.comment = "";
    stageDialogVisible.value = true;
    await nextTick();
    stageFormRef.value?.clearValidate();
  }

  async function submitStage(): Promise<void> {
    const currentOpportunity = selectedOpportunity.value;

    if (!currentOpportunity) {
      return;
    }

    const isValid = await validateForm(stageFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      await advanceOpportunityStage(currentOpportunity.id, buildAdvanceStagePayload());
      stageDialogVisible.value = false;
      ElMessage.success("商机阶段已推进。");
      await Promise.all([loadOpportunities(), refreshSelectedOpportunity()]);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "阶段推进失败，请稍后重试。"));
    }
  }

  async function openCloseDialog(opportunity: Opportunity, mode: "WON" | "LOST"): Promise<void> {
    selectedOpportunity.value = opportunity;
    closeMode.value = mode;
    closeForm.lostReason = "";
    closeForm.comment = "";
    closeDialogVisible.value = true;
    await nextTick();
    closeFormRef.value?.clearValidate();
  }

  async function submitClose(): Promise<void> {
    const currentOpportunity = selectedOpportunity.value;

    if (!currentOpportunity) {
      return;
    }

    const isValid = await validateForm(closeFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (closeMode.value === "WON") {
        await markOpportunityWon(currentOpportunity.id, buildWonPayload());
      } else {
        await markOpportunityLost(currentOpportunity.id, buildLostPayload());
      }

      closeDialogVisible.value = false;
      ElMessage.success(closeMode.value === "WON" ? "商机已标记为赢单。" : "商机已标记为输单。");
      await Promise.all([loadOpportunities(), refreshSelectedOpportunity()]);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "收口失败，请稍后重试。"));
    }
  }

  async function openDetailDrawer(opportunity: Opportunity): Promise<void> {
    try {
      selectedOpportunity.value = await fetchOpportunityDetail(opportunity.id);
      detailDrawerVisible.value = true;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "商机详情加载失败，请稍后重试。"));
    }
  }

  async function refreshSelectedOpportunity(): Promise<void> {
    if (!detailDrawerVisible.value || !selectedOpportunity.value) {
      return;
    }

    selectedOpportunity.value = await fetchOpportunityDetail(selectedOpportunity.value.id);
  }

  function handleOpportunityPageChange(page: number): void {
    opportunityTableState.page = page;
    void loadOpportunities();
  }

  function handleOpportunityPageSizeChange(pageSize: number): void {
    opportunityTableState.pageSize = pageSize;
    opportunityTableState.page = 1;
    void loadOpportunities();
  }

  watch(
    filters,
    () => {
      opportunityTableState.page = 1;
      void loadOpportunities();
    },
    {
      deep: true
    }
  );

  watch(
    () => opportunityTableState.sortPreset,
    (value) => {
      const nextSort = opportunitySortOptions.find((item) => item.value === value) ?? opportunitySortOptions[0];

      opportunityTableState.sortBy = nextSort.sortBy;
      opportunityTableState.sortOrder = nextSort.sortOrder;
      opportunityTableState.page = 1;
      void loadOpportunities();
    }
  );

  onMounted(async () => {
    await loadMeta();
    resetOpportunityForm();
    await loadOpportunities();
  });

  return {
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
  };
}
