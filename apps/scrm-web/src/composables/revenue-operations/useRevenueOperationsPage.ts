/** 场景 composable：负责经营闭环页面的上下文同步、表单编排与请求反馈。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  createContract,
  createPaymentPlan,
  createPaymentRecord,
  createQuote,
  createRenewalReminder,
  fetchCustomerRevenueOverview,
  fetchOpportunityRevenueOverview
} from "@/api/revenue-operations.api";
import { fetchCustomers, fetchCustomerDetail } from "@/api/customers.api";
import { fetchOpportunityDetail, fetchOpportunities } from "@/api/opportunities.api";
import { useViewport } from "@/composables/useViewport";
import type { Customer } from "@/types/customers";
import type { Opportunity } from "@/types/opportunities";
import type {
  ContractFormModel,
  CustomerRevenueOverview,
  OpportunityRevenueOverview,
  PaymentPlanFormModel,
  PaymentRecordFormModel,
  QuoteFormModel,
  RevenueOperationDetailType,
  RevenueOperationRecord,
  RenewalReminderFormModel
} from "@/types/revenue-operations";
import { normalizeOptionalTextForCreate, normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

function createRequiredDateRule(message: string) {
  return [{ required: true, message, trigger: "change" }];
}

function createRequiredTextRule(message: string) {
  return [{ required: true, message, trigger: "blur" }];
}

function createPositiveAmountRule(message: string) {
  return [
    {
      validator: (_rule: unknown, value: number | null, callback: (error?: Error) => void) => {
        if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
          callback(new Error(message));
          return;
        }

        callback();
      },
      trigger: "change"
    }
  ];
}

const WORKSPACE_DRAWER_COPY: Record<
  RevenueOperationDetailType,
  {
    title: string;
    description: string;
  }
> = {
  quote: {
    title: "新建报价单",
    description: "在当前客户与商机上下文中登记报价。"
  },
  contract: {
    title: "新建合同",
    description: "录入签约信息并沉淀履约周期。"
  },
  paymentPlan: {
    title: "新建回款计划",
    description: "围绕合同或商机维护后续回款节点。"
  },
  paymentRecord: {
    title: "登记回款",
    description: "记录实际到账金额、时间与备注。"
  },
  renewalReminder: {
    title: "创建续费提醒",
    description: "为到期合同或复购机会设置后续提醒。"
  }
};

function sumBy<T>(items: T[], iteratee: (item: T) => number): number {
  return items.reduce((total, item) => total + iteratee(item), 0);
}

export function useRevenueOperationsPage() {
  const route = useRoute();
  const router = useRouter();
  const { isTabletOrDown } = useViewport();

  const customers = ref<Array<{ id: string; name: string }>>([]);
  const wonOpportunities = ref<Opportunity[]>([]);
  const selectedCustomer = ref<Customer | null>(null);
  const selectedOpportunity = ref<Opportunity | null>(null);
  const customerOverview = ref<CustomerRevenueOverview | null>(null);
  const opportunityOverview = ref<OpportunityRevenueOverview | null>(null);

  const selectedCustomerId = ref("");
  const selectedOpportunityId = ref("");

  const isMetaLoading = ref(false);
  const isContextLoading = ref(false);
  const isSubmitting = ref(false);

  const workspaceDrawerVisible = ref(false);
  const workspaceDrawerMode = ref<RevenueOperationDetailType>("quote");
  const detailDrawerVisible = ref(false);
  const detailDrawerType = ref<RevenueOperationDetailType>("quote");
  const selectedDetailRecord = ref<RevenueOperationRecord | null>(null);

  const quoteFormRef = ref<FormInstance>();
  const contractFormRef = ref<FormInstance>();
  const paymentPlanFormRef = ref<FormInstance>();
  const paymentRecordFormRef = ref<FormInstance>();
  const renewalReminderFormRef = ref<FormInstance>();

  const quoteForm = reactive<QuoteFormModel>({
    title: "",
    amount: null,
    issuedAt: "",
    expiresAt: "",
    notes: ""
  });

  const contractForm = reactive<ContractFormModel>({
    title: "",
    amount: null,
    startDate: "",
    endDate: "",
    signedAt: "",
    notes: ""
  });

  const paymentPlanForm = reactive<PaymentPlanFormModel>({
    title: "",
    plannedAmount: null,
    plannedDate: "",
    contractId: "",
    notes: ""
  });

  const paymentRecordForm = reactive<PaymentRecordFormModel>({
    paymentPlanId: "",
    amount: null,
    receivedAt: "",
    note: ""
  });

  const renewalReminderForm = reactive<RenewalReminderFormModel>({
    title: "",
    contractId: "",
    remindAt: "",
    note: ""
  });

  const quoteRules: FormRules<QuoteFormModel> = {
    title: createRequiredTextRule("请输入报价标题"),
    amount: createPositiveAmountRule("请输入有效的报价金额")
  };

  const contractRules: FormRules<ContractFormModel> = {
    title: createRequiredTextRule("请输入合同标题"),
    amount: createPositiveAmountRule("请输入有效的合同金额"),
    startDate: createRequiredDateRule("请选择合同开始时间"),
    endDate: createRequiredDateRule("请选择合同结束时间")
  };

  const paymentPlanRules: FormRules<PaymentPlanFormModel> = {
    title: createRequiredTextRule("请输入回款计划标题"),
    plannedAmount: createPositiveAmountRule("请输入有效的计划金额"),
    plannedDate: createRequiredDateRule("请选择计划回款时间")
  };

  const paymentRecordRules: FormRules<PaymentRecordFormModel> = {
    paymentPlanId: [{ required: true, message: "请选择回款计划", trigger: "change" }],
    amount: createPositiveAmountRule("请输入有效的回款金额"),
    receivedAt: createRequiredDateRule("请选择实际回款时间")
  };

  const renewalReminderRules: FormRules<RenewalReminderFormModel> = {
    title: createRequiredTextRule("请输入提醒标题"),
    contractId: [{ required: true, message: "请选择关联合同", trigger: "change" }],
    remindAt: createRequiredDateRule("请选择提醒时间")
  };

  const activeOverview = computed(() => opportunityOverview.value ?? customerOverview.value);

  const activeContextLabel = computed(() => {
    if (selectedOpportunity.value) {
      return `商机视角 / ${selectedOpportunity.value.name}`;
    }

    if (selectedCustomer.value) {
      return `客户视角 / ${selectedCustomer.value.name}`;
    }

    return "未选择上下文";
  });

  const contractOptions = computed(() => activeOverview.value?.contracts ?? []);
  const paymentPlanOptions = computed(() => activeOverview.value?.paymentPlans ?? []);
  const workspaceDrawerTitle = computed(() => WORKSPACE_DRAWER_COPY[workspaceDrawerMode.value].title);
  const workspaceDrawerDescription = computed(() => WORKSPACE_DRAWER_COPY[workspaceDrawerMode.value].description);

  const summaryCards = computed(() => {
    const overview = activeOverview.value;
    const quotes = overview?.quotes ?? [];
    const contracts = overview?.contracts ?? [];
    const paymentPlans = overview?.paymentPlans ?? [];
    const paymentRecords = overview?.paymentRecords ?? [];
    const renewalReminders = overview?.renewalReminders ?? [];
    const plannedAmount = sumBy(paymentPlans, (item) => item.plannedAmount);
    const receivedAmount = sumBy(paymentPlans, (item) => item.receivedAmount);

    return [
      {
        label: "报价金额",
        value: sumBy(quotes, (item) => item.amount),
        formatAs: "amount" as const,
        helper: `${quotes.length} 笔报价`
      },
      {
        label: "合同金额",
        value: sumBy(contracts, (item) => item.amount),
        formatAs: "amount" as const,
        helper: `${contracts.length} 份合同`
      },
      {
        label: "计划应收",
        value: plannedAmount,
        formatAs: "amount" as const,
        helper: `${paymentPlans.length} 个回款节点`
      },
      {
        label: "累计已回",
        value: sumBy(paymentRecords, (item) => item.amount),
        formatAs: "amount" as const,
        helper: `待收 ${Math.max(plannedAmount - receivedAmount, 0).toLocaleString("zh-CN")} 元`
      },
      {
        label: "续费提醒",
        value: renewalReminders.length,
        formatAs: "count" as const,
        helper: `${renewalReminders.filter((item) => item.status === "PENDING").length} 条待跟进`
      }
    ];
  });

  const canCreateOpportunityScopedItems = computed(() => Boolean(selectedCustomer.value && selectedOpportunity.value));

  function setQuoteFormRef(instance: FormInstance | undefined): void {
    quoteFormRef.value = instance;
  }

  function setContractFormRef(instance: FormInstance | undefined): void {
    contractFormRef.value = instance;
  }

  function setPaymentPlanFormRef(instance: FormInstance | undefined): void {
    paymentPlanFormRef.value = instance;
  }

  function setPaymentRecordFormRef(instance: FormInstance | undefined): void {
    paymentRecordFormRef.value = instance;
  }

  function setRenewalReminderFormRef(instance: FormInstance | undefined): void {
    renewalReminderFormRef.value = instance;
  }

  function resetQuoteForm(): void {
    quoteForm.title = "";
    quoteForm.amount = null;
    quoteForm.issuedAt = "";
    quoteForm.expiresAt = "";
    quoteForm.notes = "";
  }

  function resetContractForm(): void {
    contractForm.title = "";
    contractForm.amount = null;
    contractForm.startDate = "";
    contractForm.endDate = "";
    contractForm.signedAt = "";
    contractForm.notes = "";
  }

  function resetPaymentPlanForm(): void {
    paymentPlanForm.title = "";
    paymentPlanForm.plannedAmount = null;
    paymentPlanForm.plannedDate = "";
    paymentPlanForm.contractId = contractOptions.value[0]?.id ?? "";
    paymentPlanForm.notes = "";
  }

  function resetPaymentRecordForm(): void {
    paymentRecordForm.paymentPlanId = paymentPlanOptions.value[0]?.id ?? "";
    paymentRecordForm.amount = null;
    paymentRecordForm.receivedAt = "";
    paymentRecordForm.note = "";
  }

  function resetRenewalReminderForm(): void {
    renewalReminderForm.title = "";
    renewalReminderForm.contractId = contractOptions.value[0]?.id ?? "";
    renewalReminderForm.remindAt = "";
    renewalReminderForm.note = "";
  }

  async function loadCustomersMeta(): Promise<void> {
    isMetaLoading.value = true;

    try {
      const data = await fetchCustomers({
        page: 1,
        pageSize: 100,
        sortBy: "updatedAt",
        sortOrder: "desc"
      });

      customers.value = data.items.map((item) => ({
        id: item.id,
        name: item.name
      }));
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "客户列表加载失败，请稍后重试。"));
    } finally {
      isMetaLoading.value = false;
    }
  }

  async function loadWonOpportunities(customerId: string): Promise<Opportunity[]> {
    const data = await fetchOpportunities({
      customerId,
      resultStatus: "WON",
      page: 1,
      pageSize: 100,
      sortBy: "updatedAt",
      sortOrder: "desc"
    });

    return data.items;
  }

  async function syncRouteContext(): Promise<void> {
    const routeCustomerId = typeof route.query.customerId === "string" ? route.query.customerId : "";
    const routeOpportunityId = typeof route.query.opportunityId === "string" ? route.query.opportunityId : "";

    selectedCustomerId.value = routeCustomerId;
    selectedOpportunityId.value = routeOpportunityId;

    if (!routeCustomerId && !routeOpportunityId) {
      selectedCustomer.value = null;
      selectedOpportunity.value = null;
      customerOverview.value = null;
      opportunityOverview.value = null;
      wonOpportunities.value = [];
      return;
    }

    isContextLoading.value = true;

    try {
      let resolvedCustomerId = routeCustomerId;

      if (routeOpportunityId) {
        const [opportunity, overview] = await Promise.all([
          fetchOpportunityDetail(routeOpportunityId),
          fetchOpportunityRevenueOverview(routeOpportunityId)
        ]);

        selectedOpportunity.value = opportunity;
        opportunityOverview.value = overview;
        selectedOpportunityId.value = opportunity.id;
        resolvedCustomerId = opportunity.customerId;
      } else {
        selectedOpportunity.value = null;
        opportunityOverview.value = null;
      }

      if (resolvedCustomerId) {
        const [customer, overview, opportunities] = await Promise.all([
          fetchCustomerDetail(resolvedCustomerId),
          fetchCustomerRevenueOverview(resolvedCustomerId),
          loadWonOpportunities(resolvedCustomerId)
        ]);

        selectedCustomer.value = customer;
        customerOverview.value = overview;
        wonOpportunities.value = opportunities;
        selectedCustomerId.value = customer.id;
      } else {
        selectedCustomer.value = null;
        customerOverview.value = null;
        wonOpportunities.value = [];
      }
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "经营闭环上下文加载失败，请稍后重试。"));
    } finally {
      isContextLoading.value = false;
    }
  }

  async function updateRouteContext(customerId: string, opportunityId: string): Promise<void> {
    closeWorkspaceDrawer();
    closeDetailDrawer();
    await router.replace({
      path: "/revenue-operations",
      query: {
        customerId: customerId || undefined,
        opportunityId: opportunityId || undefined
      }
    });
  }

  async function handleCustomerChange(value: string | undefined): Promise<void> {
    const nextCustomerId = value ?? "";
    const currentOpportunityBelongsToCustomer =
      selectedOpportunity.value && selectedOpportunity.value.customerId === nextCustomerId
        ? selectedOpportunity.value.id
        : "";

    await updateRouteContext(nextCustomerId, currentOpportunityBelongsToCustomer);
  }

  async function handleOpportunityChange(value: string | undefined): Promise<void> {
    const nextOpportunityId = value ?? "";
    const matchedOpportunity = wonOpportunities.value.find((item) => item.id === nextOpportunityId);
    const nextCustomerId = matchedOpportunity?.customerId ?? selectedCustomerId.value;
    await updateRouteContext(nextCustomerId, nextOpportunityId);
  }

  async function refreshContext(): Promise<void> {
    await syncRouteContext();
  }

  function closeWorkspaceDrawer(): void {
    workspaceDrawerVisible.value = false;
  }

  function closeDetailDrawer(): void {
    detailDrawerVisible.value = false;
    selectedDetailRecord.value = null;
  }

  function openDetailDrawer(type: RevenueOperationDetailType, record: RevenueOperationRecord): void {
    detailDrawerType.value = type;
    selectedDetailRecord.value = record;
    detailDrawerVisible.value = true;
  }

  async function openQuoteDrawer(): Promise<void> {
    if (!canCreateOpportunityScopedItems.value) {
      ElMessage.warning("创建报价前，请先选择客户和赢单商机。");
      return;
    }

    resetQuoteForm();
    workspaceDrawerMode.value = "quote";
    workspaceDrawerVisible.value = true;
    await nextTick();
    quoteFormRef.value?.clearValidate();
  }

  async function openContractDrawer(): Promise<void> {
    if (!canCreateOpportunityScopedItems.value) {
      ElMessage.warning("创建合同前，请先选择客户和赢单商机。");
      return;
    }

    resetContractForm();
    workspaceDrawerMode.value = "contract";
    workspaceDrawerVisible.value = true;
    await nextTick();
    contractFormRef.value?.clearValidate();
  }

  async function openPaymentPlanDrawer(): Promise<void> {
    if (!canCreateOpportunityScopedItems.value) {
      ElMessage.warning("创建回款计划前，请先选择客户和赢单商机。");
      return;
    }

    resetPaymentPlanForm();
    workspaceDrawerMode.value = "paymentPlan";
    workspaceDrawerVisible.value = true;
    await nextTick();
    paymentPlanFormRef.value?.clearValidate();
  }

  async function openPaymentRecordDrawer(): Promise<void> {
    if (paymentPlanOptions.value.length === 0) {
      ElMessage.warning("请先创建回款计划，再登记回款记录。");
      return;
    }

    resetPaymentRecordForm();
    workspaceDrawerMode.value = "paymentRecord";
    workspaceDrawerVisible.value = true;
    await nextTick();
    paymentRecordFormRef.value?.clearValidate();
  }

  async function openRenewalReminderDrawer(): Promise<void> {
    if (contractOptions.value.length === 0 || !selectedCustomer.value) {
      ElMessage.warning("请先选择客户并创建合同，再设置续费提醒。");
      return;
    }

    resetRenewalReminderForm();
    workspaceDrawerMode.value = "renewalReminder";
    workspaceDrawerVisible.value = true;
    await nextTick();
    renewalReminderFormRef.value?.clearValidate();
  }

  async function submitQuote(): Promise<void> {
    if (!selectedCustomer.value || !selectedOpportunity.value) {
      return;
    }

    const isValid = await validateForm(quoteFormRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await createQuote({
        customerId: selectedCustomer.value.id,
        opportunityId: selectedOpportunity.value.id,
        title: normalizeRequiredText(quoteForm.title),
        amount: quoteForm.amount ?? 0,
        issuedAt: normalizeOptionalTextForCreate(quoteForm.issuedAt),
        expiresAt: normalizeOptionalTextForCreate(quoteForm.expiresAt),
        notes: normalizeOptionalTextForCreate(quoteForm.notes)
      });

      workspaceDrawerVisible.value = false;
      ElMessage.success("报价单已创建。");
      await refreshContext();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "报价单创建失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitContract(): Promise<void> {
    if (!selectedCustomer.value || !selectedOpportunity.value) {
      return;
    }

    const isValid = await validateForm(contractFormRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await createContract({
        customerId: selectedCustomer.value.id,
        opportunityId: selectedOpportunity.value.id,
        title: normalizeRequiredText(contractForm.title),
        amount: contractForm.amount ?? 0,
        startDate: normalizeRequiredText(contractForm.startDate),
        endDate: normalizeRequiredText(contractForm.endDate),
        signedAt: normalizeOptionalTextForCreate(contractForm.signedAt),
        notes: normalizeOptionalTextForCreate(contractForm.notes)
      });

      workspaceDrawerVisible.value = false;
      ElMessage.success("合同已创建。");
      await refreshContext();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "合同创建失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitPaymentPlan(): Promise<void> {
    if (!selectedCustomer.value || !selectedOpportunity.value) {
      return;
    }

    const isValid = await validateForm(paymentPlanFormRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await createPaymentPlan({
        customerId: selectedCustomer.value.id,
        opportunityId: selectedOpportunity.value.id,
        title: normalizeRequiredText(paymentPlanForm.title),
        plannedAmount: paymentPlanForm.plannedAmount ?? 0,
        plannedDate: normalizeRequiredText(paymentPlanForm.plannedDate),
        contractId: normalizeOptionalTextForCreate(paymentPlanForm.contractId),
        notes: normalizeOptionalTextForCreate(paymentPlanForm.notes)
      });

      workspaceDrawerVisible.value = false;
      ElMessage.success("回款计划已创建。");
      await refreshContext();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "回款计划创建失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitPaymentRecord(): Promise<void> {
    const isValid = await validateForm(paymentRecordFormRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await createPaymentRecord({
        paymentPlanId: normalizeRequiredText(paymentRecordForm.paymentPlanId),
        amount: paymentRecordForm.amount ?? 0,
        receivedAt: normalizeRequiredText(paymentRecordForm.receivedAt),
        note: normalizeOptionalTextForCreate(paymentRecordForm.note)
      });

      workspaceDrawerVisible.value = false;
      ElMessage.success("回款记录已登记。");
      await refreshContext();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "回款记录登记失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitRenewalReminder(): Promise<void> {
    if (!selectedCustomer.value) {
      return;
    }

    const isValid = await validateForm(renewalReminderFormRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await createRenewalReminder({
        customerId: selectedCustomer.value.id,
        opportunityId: selectedOpportunity.value?.id,
        contractId: normalizeRequiredText(renewalReminderForm.contractId),
        title: normalizeRequiredText(renewalReminderForm.title),
        remindAt: normalizeRequiredText(renewalReminderForm.remindAt),
        note: normalizeOptionalTextForCreate(renewalReminderForm.note)
      });

      workspaceDrawerVisible.value = false;
      ElMessage.success("续费提醒已创建。");
      await refreshContext();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "续费提醒创建失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  watch(
    () => [route.query.customerId, route.query.opportunityId],
    () => {
      void syncRouteContext();
    }
  );

  onMounted(async () => {
    await loadCustomersMeta();
    await syncRouteContext();
  });

  return {
    activeContextLabel,
    activeOverview,
    canCreateOpportunityScopedItems,
    closeDetailDrawer,
    closeWorkspaceDrawer,
    contractOptions,
    contractForm,
    contractRules,
    customerOverview,
    customers,
    detailDrawerType,
    detailDrawerVisible,
    handleCustomerChange,
    handleOpportunityChange,
    isContextLoading,
    isMetaLoading,
    isSubmitting,
    isTabletOrDown,
    openContractDrawer,
    openDetailDrawer,
    openPaymentPlanDrawer,
    openPaymentRecordDrawer,
    openQuoteDrawer,
    openRenewalReminderDrawer,
    opportunityOverview,
    paymentPlanForm,
    paymentPlanOptions,
    paymentPlanRules,
    paymentRecordForm,
    paymentRecordRules,
    quoteForm,
    quoteRules,
    refreshContext,
    renewalReminderForm,
    renewalReminderRules,
    selectedCustomer,
    selectedCustomerId,
    selectedDetailRecord,
    selectedOpportunity,
    selectedOpportunityId,
    setContractFormRef,
    setPaymentPlanFormRef,
    setPaymentRecordFormRef,
    setQuoteFormRef,
    setRenewalReminderFormRef,
    summaryCards,
    submitContract,
    submitPaymentPlan,
    submitPaymentRecord,
    submitQuote,
    submitRenewalReminder,
    wonOpportunities,
    workspaceDrawerDescription,
    workspaceDrawerMode,
    workspaceDrawerTitle,
    workspaceDrawerVisible
  };
}
