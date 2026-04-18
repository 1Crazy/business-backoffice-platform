/** OA 审批 API：负责把模板驱动流程转换成 OA 页面可消费的请求契约。 */
import { approveWorkflowTask, cancelWorkflowInstance, fetchMyWorkflowInstances, fetchPendingWorkflowTasks, fetchWorkflowInstance, rejectWorkflowTask, startWorkflowByTemplateKey } from "@/api/workflow.api";
import type {
  AdministrativeRequestDetail,
  AdministrativeRequestItem,
  AdministrativeRequestPayload,
  AdministrativeRequestStatus,
  AdministrativeRequestType,
  ApprovalActionPayload,
  ApprovalDecision,
  LeaveRequestItem,
  LeaveRequestPayload,
  LeaveRequestStatus,
  ListAdministrativeRequestQuery,
  PendingApprovalCategory,
  PendingApprovalItem,
  WorkflowAction,
  WorkflowInstance,
  WorkflowInstanceStatus,
  WorkflowPendingTask,
  WorkflowTask,
  WorkflowTemplateKey
} from "@/types/office-automation";

const LEAVE_TEMPLATE_KEY = "LEAVE";
const ADMINISTRATIVE_TEMPLATE_KEYS: AdministrativeRequestType[] = ["REIMBURSEMENT", "TRAVEL", "PURCHASE", "SEAL"];

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: "年假",
  SICK: "病假",
  PERSONAL: "事假",
  OTHER: "其他"
};

export async function fetchPendingApprovals(): Promise<PendingApprovalItem[]> {
  const tasks = await fetchPendingWorkflowTasks();

  return tasks
    .map((task) => {
      const templateKey = normalizeWorkflowTemplateKey(task.template.key);
      const requestCategory = resolveRequestCategory(templateKey);

      return {
        id: task.id,
        taskId: task.id,
        instanceId: task.instanceId,
        requestCategory,
        requestType: requestCategory === "LEAVE" ? readRecordString(task.formData.leaveType) : templateKey,
        templateKey,
        requestNo: requestCategory === "ADMINISTRATIVE" ? task.businessKey ?? task.instanceId : null,
        applicantName: task.applicant.displayName,
        title: task.title,
        summary: buildWorkflowSummary(templateKey, task.formData),
        submittedAt: task.submittedAt,
        currentNodeName: task.nodeName,
        status: mapWorkflowStatusToApprovalStatus(task.status)
      };
    })
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
}

export async function fetchMyLeaveRequests(): Promise<LeaveRequestItem[]> {
  const instances = await fetchMyWorkflowInstances();

  return instances
    .filter((instance) => normalizeWorkflowTemplateKey(instance.template.key) === LEAVE_TEMPLATE_KEY)
    .map((instance) => mapWorkflowInstanceToLeaveRequest(instance));
}

export async function createLeaveRequest(payload: LeaveRequestPayload): Promise<void> {
  await startWorkflowByTemplateKey(LEAVE_TEMPLATE_KEY, {
    title: `${formatLeaveType(payload.leaveType)}申请`,
    formData: {
      ...payload
    }
  });
}

export async function decideLeaveRequest(requestId: string, payload: ApprovalActionPayload): Promise<void> {
  await submitWorkflowDecision(requestId, payload);
}

export async function fetchMyAdministrativeRequests(
  query?: ListAdministrativeRequestQuery
): Promise<AdministrativeRequestItem[]> {
  const instances = await fetchMyWorkflowInstances();

  return instances
    .filter((instance) => isAdministrativeTemplate(instance.template.key))
    .map((instance) => mapWorkflowInstanceToAdministrativeRequest(instance))
    .filter((item) => matchesAdministrativeQuery(item, query));
}

export async function fetchPendingAdministrativeApprovals(
  query?: ListAdministrativeRequestQuery
): Promise<AdministrativeRequestItem[]> {
  const tasks = await fetchPendingWorkflowTasks();

  return tasks
    .filter((task) => isAdministrativeTemplate(task.template.key))
    .map((task) => mapWorkflowPendingTaskToAdministrativeRequest(task))
    .filter((item) => matchesAdministrativeQuery(item, query));
}

export async function fetchAdministrativeRequestDetail(requestId: string): Promise<AdministrativeRequestDetail> {
  const instance = await fetchWorkflowInstance(requestId);
  return mapWorkflowInstanceToAdministrativeRequestDetail(instance);
}

export async function createAdministrativeRequest(payload: AdministrativeRequestPayload): Promise<void> {
  await startWorkflowByTemplateKey(payload.type, {
    title: payload.title,
    businessKey: buildAdministrativeRequestNo(payload.type),
    formData: {
      ...payload
    }
  });
}

export async function decideAdministrativeRequest(requestId: string, payload: ApprovalActionPayload): Promise<void> {
  await submitWorkflowDecision(requestId, payload);
}

export async function cancelAdministrativeRequest(requestId: string): Promise<void> {
  await cancelWorkflowInstance(requestId);
}

async function submitWorkflowDecision(taskId: string, payload: ApprovalActionPayload): Promise<void> {
  if (payload.decision === "REJECTED") {
    await rejectWorkflowTask(taskId, payload);
    return;
  }

  await approveWorkflowTask(taskId, payload);
}

function mapWorkflowInstanceToLeaveRequest(instance: WorkflowInstance): LeaveRequestItem {
  return {
    id: instance.id,
    leaveType: readRecordString(instance.formData.leaveType),
    startAt: readRecordString(instance.formData.startAt),
    endAt: readRecordString(instance.formData.endAt),
    reason: readRecordString(instance.formData.reason),
    status: mapWorkflowStatusToApprovalStatus(instance.status),
    applicantName: instance.applicant.displayName,
    currentApproverName: resolveCurrentHandlerName(instance),
    latestComment: resolveLatestComment(instance.actions),
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt
  };
}

function mapWorkflowInstanceToAdministrativeRequest(instance: WorkflowInstance): AdministrativeRequestItem {
  const type = normalizeAdministrativeType(instance.template.key);

  return {
    id: instance.id,
    requestNo: instance.businessKey ?? buildAdministrativeRequestNo(type, instance.submittedAt),
    type,
    title: instance.title,
    summary: buildWorkflowSummary(type, instance.formData),
    reason: readRecordString(instance.formData.reason),
    status: mapWorkflowStatusToApprovalStatus(instance.status),
    attachmentNames: readStringArray(instance.formData.attachmentNames),
    applicantName: instance.applicant.displayName,
    approverName: resolveCurrentHandlerName(instance),
    latestComment: resolveLatestComment(instance.actions),
    submittedAt: instance.submittedAt,
    decidedAt: instance.completedAt ?? null,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt
  };
}

function mapWorkflowPendingTaskToAdministrativeRequest(task: WorkflowPendingTask): AdministrativeRequestItem {
  const type = normalizeAdministrativeType(task.template.key);

  return {
    id: task.instanceId,
    requestNo: task.businessKey ?? buildAdministrativeRequestNo(type, task.submittedAt),
    type,
    title: task.title,
    summary: buildWorkflowSummary(type, task.formData),
    reason: readRecordString(task.formData.reason),
    status: mapWorkflowStatusToApprovalStatus(task.status),
    attachmentNames: readStringArray(task.formData.attachmentNames),
    applicantName: task.applicant.displayName,
    approverName: task.nodeName,
    workflowTaskId: task.id,
    latestComment: null,
    submittedAt: task.submittedAt,
    decidedAt: null,
    createdAt: task.submittedAt,
    updatedAt: task.submittedAt
  };
}

function mapWorkflowInstanceToAdministrativeRequestDetail(instance: WorkflowInstance): AdministrativeRequestDetail {
  const item = mapWorkflowInstanceToAdministrativeRequest(instance);
  const type = normalizeAdministrativeType(instance.template.key);

  return {
    ...item,
    formFields: buildAdministrativeRequestFields(type, instance.formData),
    timeline: instance.actions.map((action) => ({
      actionType: mapWorkflowActionToAdministrativeAction(action.actionType),
      actorName: action.actor.displayName,
      comment: action.comment ?? null,
      createdAt: action.createdAt
    }))
  };
}

function buildAdministrativeRequestFields(
  type: AdministrativeRequestType,
  formData: Record<string, unknown>
) {
  switch (type) {
    case "REIMBURSEMENT":
      return [
        { label: "报销日期", value: readRecordString(formData.expenseDate) || "-" },
        { label: "报销类别", value: readRecordString(formData.expenseCategory) || "-" },
        { label: "报销对象", value: readRecordString(formData.payeeName) || "-" },
        { label: "报销金额", value: formatUnknownValue(formData.amount) }
      ];
    case "TRAVEL":
      return [
        { label: "开始时间", value: readRecordString(formData.startAt) || "-" },
        { label: "结束时间", value: readRecordString(formData.endAt) || "-" },
        { label: "目的地", value: readRecordString(formData.destination) || "-" },
        { label: "交通方式", value: readRecordString(formData.transportation) || "-" },
        { label: "预估费用", value: formatUnknownValue(formData.estimatedAmount) }
      ];
    case "PURCHASE":
      return [
        { label: "采购物品", value: readRecordString(formData.itemName) || "-" },
        { label: "采购数量", value: formatUnknownValue(formData.quantity) },
        { label: "预算金额", value: formatUnknownValue(formData.budgetAmount) },
        { label: "期望到位时间", value: readRecordString(formData.neededBy) || "-" }
      ];
    case "SEAL":
      return [
        { label: "文件名称", value: readRecordString(formData.documentName) || "-" },
        { label: "用印类型", value: readRecordString(formData.sealType) || "-" },
        { label: "用印时间", value: readRecordString(formData.useDate) || "-" },
        { label: "用印份数", value: formatUnknownValue(formData.copyCount) }
      ];
    default:
      return [];
  }
}

function buildWorkflowSummary(templateKey: WorkflowTemplateKey, formData: Record<string, unknown>): string {
  switch (templateKey) {
    case LEAVE_TEMPLATE_KEY: {
      const startAt = readRecordString(formData.startAt);
      const endAt = readRecordString(formData.endAt);
      return [startAt, endAt].filter(Boolean).join(" 至 ") || readRecordString(formData.reason) || "-";
    }
    case "REIMBURSEMENT":
      return [readRecordString(formData.expenseCategory), formatUnknownValue(formData.amount)]
        .filter(Boolean)
        .join(" / ");
    case "TRAVEL":
      return [readRecordString(formData.destination), readRecordString(formData.startAt), readRecordString(formData.endAt)]
        .filter(Boolean)
        .join(" / ");
    case "PURCHASE":
      return [readRecordString(formData.itemName), formatUnknownValue(formData.budgetAmount)]
        .filter(Boolean)
        .join(" / ");
    case "SEAL":
      return [readRecordString(formData.documentName), readRecordString(formData.sealType)]
        .filter(Boolean)
        .join(" / ");
    default:
      return readRecordString(formData.reason) || "-";
  }
}

function resolveCurrentHandlerName(instance: WorkflowInstance): string | null {
  const pendingAssignees = instance.tasks
    .filter((task) => task.status === "PENDING")
    .map((task) => task.assignee.displayName);

  return pendingAssignees.length ? Array.from(new Set(pendingAssignees)).join(" / ") : null;
}

function resolveLatestComment(actions: WorkflowAction[]): string | null {
  return actions
    .slice()
    .reverse()
    .find((item) => item.comment?.trim())?.comment?.trim() ?? null;
}

function matchesAdministrativeQuery(item: AdministrativeRequestItem, query?: ListAdministrativeRequestQuery): boolean {
  if (!query) {
    return true;
  }

  if (query.type && item.type !== query.type) {
    return false;
  }

  if (query.status && item.status !== query.status) {
    return false;
  }

  return true;
}

function normalizeWorkflowTemplateKey(value: string): WorkflowTemplateKey {
  return value === LEAVE_TEMPLATE_KEY ? LEAVE_TEMPLATE_KEY : normalizeAdministrativeType(value);
}

function normalizeAdministrativeType(value: string): AdministrativeRequestType {
  return ADMINISTRATIVE_TEMPLATE_KEYS.includes(value as AdministrativeRequestType)
    ? (value as AdministrativeRequestType)
    : "REIMBURSEMENT";
}

function isAdministrativeTemplate(value: string): boolean {
  return ADMINISTRATIVE_TEMPLATE_KEYS.includes(value as AdministrativeRequestType);
}

function resolveRequestCategory(templateKey: WorkflowTemplateKey): PendingApprovalCategory {
  return templateKey === LEAVE_TEMPLATE_KEY ? "LEAVE" : "ADMINISTRATIVE";
}

function mapWorkflowStatusToApprovalStatus(
  value: WorkflowInstanceStatus
): LeaveRequestStatus | AdministrativeRequestStatus {
  switch (value) {
    case "APPROVED":
      return "APPROVED";
    case "REJECTED":
      return "REJECTED";
    case "CANCELLED":
    case "TERMINATED":
      return "CANCELLED";
    case "IN_PROGRESS":
    default:
      return "PENDING";
  }
}

function mapWorkflowActionToAdministrativeAction(value: WorkflowAction["actionType"]) {
  switch (value) {
    case "APPROVED":
      return "APPROVED" as const;
    case "REJECTED":
      return "REJECTED" as const;
    case "CANCELLED":
    case "TERMINATED":
      return "CANCELLED" as const;
    case "SUBMITTED":
    default:
      return "SUBMITTED" as const;
  }
}

function formatLeaveType(value?: string): string {
  if (!value) {
    return "请假";
  }

  return LEAVE_TYPE_LABELS[value] ?? value;
}

function buildAdministrativeRequestNo(type: AdministrativeRequestType, submittedAt = new Date().toISOString()): string {
  const prefixMap: Record<AdministrativeRequestType, string> = {
    REIMBURSEMENT: "BX",
    TRAVEL: "CC",
    PURCHASE: "CG",
    SEAL: "YY"
  };
  const digits = submittedAt.replace(/\D/g, "").slice(0, 14);
  return `${prefixMap[type]}-${digits || Date.now()}`;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
}

function readRecordString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatUnknownValue(value: unknown): string {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "-";
}
