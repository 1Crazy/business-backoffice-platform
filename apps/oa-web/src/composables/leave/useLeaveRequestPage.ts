/** 请假申请 composable：负责表单状态、提交编排与最近申请回显。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { nextTick, onMounted, reactive, ref } from "vue";

import { createLeaveRequest, fetchMyLeaveRequests } from "@/api/approvals.api";
import type { LeaveRequestItem, LeaveRequestPayload } from "@/types/office-automation";
import { normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

interface LeaveRequestFormModel {
  leaveType: string;
  startAt: string;
  endAt: string;
  reason: string;
}

export function useLeaveRequestPage() {
  const formRef = ref<FormInstance>();
  const recentRequests = ref<LeaveRequestItem[]>([]);
  const submitting = ref(false);

  const form = reactive<LeaveRequestFormModel>({
    leaveType: "ANNUAL",
    startAt: "",
    endAt: "",
    reason: ""
  });

  const rules: FormRules<LeaveRequestFormModel> = {
    leaveType: [{ required: true, message: "请选择请假类型", trigger: "change" }],
    startAt: [{ required: true, message: "请选择开始时间", trigger: "change" }],
    endAt: [{ required: true, message: "请选择结束时间", trigger: "change" }],
    reason: [
      { required: true, message: "请填写请假事由", trigger: "blur" },
      { min: 4, message: "请假事由至少需要 4 个字符", trigger: "blur" }
    ]
  };

  function setFormRef(instance: FormInstance | undefined): void {
    formRef.value = instance;
  }

  function resetForm(): void {
    form.leaveType = "ANNUAL";
    form.startAt = "";
    form.endAt = "";
    form.reason = "";
  }

  function buildPayload(): LeaveRequestPayload {
    return {
      leaveType: normalizeRequiredText(form.leaveType),
      startAt: normalizeRequiredText(form.startAt),
      endAt: normalizeRequiredText(form.endAt),
      reason: normalizeRequiredText(form.reason)
    };
  }

  async function loadRecentRequests(): Promise<void> {
    try {
      recentRequests.value = await fetchMyLeaveRequests();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "最近申请加载失败，请稍后重试。"));
    }
  }

  async function submit(): Promise<void> {
    const isValid = await validateForm(formRef.value);

    if (!isValid) {
      return;
    }

    submitting.value = true;

    try {
      await createLeaveRequest(buildPayload());
      ElMessage.success("请假申请已提交。");
      resetForm();
      await nextTick();
      formRef.value?.clearValidate();
      await loadRecentRequests();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "请假申请提交失败，请稍后重试。"));
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    void loadRecentRequests();
  });

  return {
    form,
    recentRequests,
    rules,
    setFormRef,
    submit,
    submitting
  };
}
