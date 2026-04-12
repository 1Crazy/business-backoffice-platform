/** 行政申请页面 composable：负责动态表单、路由类型同步与最近申请回显。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, FormItemRule } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { createAdministrativeRequest, fetchMyAdministrativeRequests } from "@/api/approvals.api";
import type {
  AdministrativeRequestItem,
  AdministrativeRequestPayload,
  AdministrativeRequestType
} from "@/types/office-automation";
import {
  normalizeOptionalArray,
  normalizeOptionalTextForCreate,
  normalizeRequiredText
} from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const REQUEST_TYPES: AdministrativeRequestType[] = ["REIMBURSEMENT", "TRAVEL", "PURCHASE", "SEAL"];

interface AdministrativeRequestFormModel {
  type: AdministrativeRequestType;
  title: string;
  reason: string;
  attachmentNames: string[];
  expenseDate: string;
  expenseCategory: string;
  amount: number | null;
  payeeName: string;
  startAt: string;
  endAt: string;
  destination: string;
  transportation: string;
  estimatedAmount: number | null;
  itemName: string;
  quantity: number | null;
  budgetAmount: number | null;
  neededBy: string;
  documentName: string;
  sealType: string;
  useDate: string;
  copyCount: number | null;
}

function normalizeRequestType(value: unknown): AdministrativeRequestType {
  if (typeof value !== "string") {
    return "REIMBURSEMENT";
  }

  return REQUEST_TYPES.includes(value as AdministrativeRequestType)
    ? (value as AdministrativeRequestType)
    : "REIMBURSEMENT";
}

function createConditionalRequiredRule(
  form: AdministrativeRequestFormModel,
  targetType: AdministrativeRequestType,
  label: string
): FormItemRule {
  return {
    validator(_rule, value: unknown, callback) {
      if (form.type !== targetType) {
        callback();
        return;
      }

      if (typeof value === "number") {
        callback(Number.isFinite(value) ? undefined : new Error(`请填写${label}`));
        return;
      }

      if (typeof value === "string" && value.trim()) {
        callback();
        return;
      }

      callback(new Error(`请填写${label}`));
    },
    trigger: ["blur", "change"]
  };
}

export function useAdministrativeRequestPage() {
  const route = useRoute();
  const router = useRouter();
  const formRef = ref<FormInstance>();
  const recentRequests = ref<AdministrativeRequestItem[]>([]);
  const isRecentLoading = ref(true);
  const submitting = ref(false);

  const form = reactive<AdministrativeRequestFormModel>({
    type: "REIMBURSEMENT",
    title: "",
    reason: "",
    attachmentNames: [],
    expenseDate: "",
    expenseCategory: "",
    amount: null,
    payeeName: "",
    startAt: "",
    endAt: "",
    destination: "",
    transportation: "",
    estimatedAmount: null,
    itemName: "",
    quantity: null,
    budgetAmount: null,
    neededBy: "",
    documentName: "",
    sealType: "",
    useDate: "",
    copyCount: null
  });

  const activeRequestType = computed(() => normalizeRequestType(route.query.type));

  const rules: FormRules<AdministrativeRequestFormModel> = {
    type: [{ required: true, message: "请选择申请类型", trigger: "change" }],
    title: [
      { required: true, message: "请输入申请标题", trigger: "blur" },
      { min: 2, message: "申请标题至少需要 2 个字符", trigger: "blur" }
    ],
    reason: [
      { required: true, message: "请输入申请说明", trigger: "blur" },
      { min: 4, message: "申请说明至少需要 4 个字符", trigger: "blur" }
    ],
    expenseDate: [createConditionalRequiredRule(form, "REIMBURSEMENT", "报销日期")],
    expenseCategory: [createConditionalRequiredRule(form, "REIMBURSEMENT", "报销类别")],
    amount: [createConditionalRequiredRule(form, "REIMBURSEMENT", "报销金额")],
    payeeName: [createConditionalRequiredRule(form, "REIMBURSEMENT", "报销对象")],
    startAt: [createConditionalRequiredRule(form, "TRAVEL", "出差开始时间")],
    endAt: [
      createConditionalRequiredRule(form, "TRAVEL", "出差结束时间"),
      {
        validator(_rule, value: unknown, callback) {
          if (form.type !== "TRAVEL") {
            callback();
            return;
          }

          if (typeof form.startAt !== "string" || typeof value !== "string" || !form.startAt || !value) {
            callback();
            return;
          }

          if (new Date(form.startAt).getTime() >= new Date(value).getTime()) {
            callback(new Error("出差结束时间必须晚于开始时间"));
            return;
          }

          callback();
        },
        trigger: "change"
      }
    ],
    destination: [createConditionalRequiredRule(form, "TRAVEL", "出差目的地")],
    transportation: [createConditionalRequiredRule(form, "TRAVEL", "交通方式")],
    estimatedAmount: [createConditionalRequiredRule(form, "TRAVEL", "预估费用")],
    itemName: [createConditionalRequiredRule(form, "PURCHASE", "采购物品")],
    quantity: [createConditionalRequiredRule(form, "PURCHASE", "采购数量")],
    budgetAmount: [createConditionalRequiredRule(form, "PURCHASE", "预算金额")],
    neededBy: [createConditionalRequiredRule(form, "PURCHASE", "期望到位时间")],
    documentName: [createConditionalRequiredRule(form, "SEAL", "文件名称")],
    sealType: [createConditionalRequiredRule(form, "SEAL", "用印类型")],
    useDate: [createConditionalRequiredRule(form, "SEAL", "用印时间")],
    copyCount: [createConditionalRequiredRule(form, "SEAL", "用印份数")]
  };

  function setFormRef(instance: FormInstance | undefined): void {
    formRef.value = instance;
  }

  function resetTypeSpecificFields(): void {
    form.expenseDate = "";
    form.expenseCategory = "";
    form.amount = null;
    form.payeeName = "";
    form.startAt = "";
    form.endAt = "";
    form.destination = "";
    form.transportation = "";
    form.estimatedAmount = null;
    form.itemName = "";
    form.quantity = null;
    form.budgetAmount = null;
    form.neededBy = "";
    form.documentName = "";
    form.sealType = "";
    form.useDate = "";
    form.copyCount = null;
  }

  function resetForm(): void {
    form.title = "";
    form.reason = "";
    form.attachmentNames = [];
    resetTypeSpecificFields();
  }

  function buildPayload(): AdministrativeRequestPayload {
    const basePayload: AdministrativeRequestPayload = {
      type: form.type,
      title: normalizeRequiredText(form.title),
      reason: normalizeRequiredText(form.reason),
      attachmentNames: normalizeOptionalArray(form.attachmentNames)
    };

    switch (form.type) {
      case "REIMBURSEMENT":
        return {
          ...basePayload,
          expenseDate: normalizeRequiredText(form.expenseDate),
          expenseCategory: normalizeRequiredText(form.expenseCategory),
          amount: form.amount ?? undefined,
          payeeName: normalizeRequiredText(form.payeeName)
        };
      case "TRAVEL":
        return {
          ...basePayload,
          startAt: normalizeRequiredText(form.startAt),
          endAt: normalizeRequiredText(form.endAt),
          destination: normalizeRequiredText(form.destination),
          transportation: normalizeRequiredText(form.transportation),
          estimatedAmount: form.estimatedAmount ?? undefined
        };
      case "PURCHASE":
        return {
          ...basePayload,
          itemName: normalizeRequiredText(form.itemName),
          quantity: form.quantity ?? undefined,
          budgetAmount: form.budgetAmount ?? undefined,
          neededBy: normalizeRequiredText(form.neededBy)
        };
      case "SEAL":
        return {
          ...basePayload,
          documentName: normalizeRequiredText(form.documentName),
          sealType: normalizeRequiredText(form.sealType),
          useDate: normalizeRequiredText(form.useDate),
          copyCount: form.copyCount ?? undefined
        };
      default:
        return basePayload;
    }
  }

  async function syncTypeQuery(type: AdministrativeRequestType): Promise<void> {
    if (activeRequestType.value === type) {
      return;
    }

    await router.replace({
      query: {
        ...route.query,
        type
      }
    });
  }

  async function loadRecentRequests(): Promise<void> {
    isRecentLoading.value = true;

    try {
      recentRequests.value = await fetchMyAdministrativeRequests();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "最近行政申请加载失败，请稍后重试。"));
    } finally {
      isRecentLoading.value = false;
    }
  }

  async function handleTypeChange(type: AdministrativeRequestType): Promise<void> {
    form.type = type;
    await syncTypeQuery(type);
    await nextTick();
    formRef.value?.clearValidate();
  }

  async function submit(): Promise<void> {
    const isValid = await validateForm(formRef.value);

    if (!isValid) {
      return;
    }

    submitting.value = true;

    try {
      await createAdministrativeRequest(buildPayload());
      ElMessage.success("行政申请已提交。");
      resetForm();
      await nextTick();
      formRef.value?.clearValidate();
      await loadRecentRequests();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "行政申请提交失败，请稍后重试。"));
    } finally {
      submitting.value = false;
    }
  }

  watch(
    activeRequestType,
    (type) => {
      form.type = type;
    },
    {
      immediate: true
    }
  );

  onMounted(() => {
    void loadRecentRequests();
  });

  return {
    form,
    handleTypeChange,
    isRecentLoading,
    recentRequests,
    requestTypes: REQUEST_TYPES,
    rules,
    setFormRef,
    submit,
    submitting,
    loadRecentRequests,
    normalizeOptionalTextForCreate
  };
}
