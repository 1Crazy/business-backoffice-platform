import type { RouteLocationRaw } from "vue-router";

import type {
  AdministrativeRequestType,
  PendingApprovalItem,
  WorkflowRequestSummaryItem,
  WorkflowTemplateKey
} from "@/types/office-automation";

export interface WorkflowTemplateDefinition {
  key: WorkflowTemplateKey;
  label: string;
  shortLabel: string;
  caption: string;
  createRoute: RouteLocationRaw;
  listRoute: RouteLocationRaw;
}

export const WORKFLOW_TEMPLATE_DEFINITIONS: WorkflowTemplateDefinition[] = [
  {
    key: "LEAVE",
    label: "请假申请",
    shortLabel: "请假",
    caption: "假勤",
    createRoute: "/leave/request",
    listRoute: "/approvals/mine"
  },
  {
    key: "REIMBURSEMENT",
    label: "报销申请",
    shortLabel: "报销",
    caption: "费用",
    createRoute: {
      path: "/administrative-requests/new",
      query: {
        type: "REIMBURSEMENT"
      }
    },
    listRoute: "/approvals/mine"
  },
  {
    key: "TRAVEL",
    label: "出差申请",
    shortLabel: "出差",
    caption: "行程",
    createRoute: {
      path: "/administrative-requests/new",
      query: {
        type: "TRAVEL"
      }
    },
    listRoute: "/approvals/mine"
  },
  {
    key: "PURCHASE",
    label: "采购申请",
    shortLabel: "采购",
    caption: "采购",
    createRoute: {
      path: "/administrative-requests/new",
      query: {
        type: "PURCHASE"
      }
    },
    listRoute: "/approvals/mine"
  },
  {
    key: "SEAL",
    label: "用印申请",
    shortLabel: "用印",
    caption: "法务",
    createRoute: {
      path: "/administrative-requests/new",
      query: {
        type: "SEAL"
      }
    },
    listRoute: "/approvals/mine"
  }
];

export const WORKFLOW_TEMPLATE_KEY_ORDER = WORKFLOW_TEMPLATE_DEFINITIONS.map((item) => item.key);

const WORKFLOW_TEMPLATE_MAP = new Map(
  WORKFLOW_TEMPLATE_DEFINITIONS.map((item) => [
    item.key,
    item
  ] satisfies [WorkflowTemplateKey, WorkflowTemplateDefinition])
);

export function getWorkflowTemplateDefinition(key: WorkflowTemplateKey): WorkflowTemplateDefinition {
  return WORKFLOW_TEMPLATE_MAP.get(key) ?? WORKFLOW_TEMPLATE_MAP.get("LEAVE")!;
}

export function resolveWorkflowTemplateKeyByAdministrativeType(
  requestType?: AdministrativeRequestType | string | null
): WorkflowTemplateKey {
  if (requestType === "REIMBURSEMENT" || requestType === "TRAVEL" || requestType === "PURCHASE" || requestType === "SEAL") {
    return requestType;
  }

  return "REIMBURSEMENT";
}

export function resolveWorkflowTemplateKeyByApproval(item: Pick<PendingApprovalItem, "requestCategory" | "requestType">) {
  if (item.requestCategory === "LEAVE") {
    return "LEAVE";
  }

  return resolveWorkflowTemplateKeyByAdministrativeType(item.requestType);
}

export function resolveWorkflowTemplateKeyByRequest(
  item: Pick<WorkflowRequestSummaryItem, "requestCategory" | "templateKey">
) {
  return item.requestCategory === "LEAVE" ? "LEAVE" : item.templateKey;
}
