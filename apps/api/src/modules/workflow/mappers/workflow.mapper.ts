/** workflow 模块 mapper：负责把流程模板与实例持久化结果转换为接口结构。 */
import { toIsoString } from "@/common/mappers/date-time.mapper";
import type {
  WorkflowInstanceRecord,
  WorkflowPendingTaskRecord,
  WorkflowTemplateRecord
} from "../repositories/workflow.repository";

export function mapWorkflowTemplate(record: WorkflowTemplateRecord) {
  return {
    id: record.id,
    key: record.key,
    name: record.name,
    description: record.description ?? null,
    businessType: record.businessType,
    version: record.version,
    status: record.status,
    formSchema: readRecordObject(record.formSchema),
    defaultCcUserIds: readStringArray(record.defaultCcUserIds),
    nodes: record.nodes.map((node) => ({
      id: node.id,
      nodeKey: node.nodeKey,
      name: node.name,
      nodeType: node.nodeType,
      position: node.position,
      assignmentType: node.assignmentType,
      assignmentConfig: readRecordObject(node.assignmentConfig),
      branchRules: node.branchRules ?? null,
      fallbackNodeKey: node.fallbackNodeKey ?? null,
      allowAddSign: node.allowAddSign,
      allowTransfer: node.allowTransfer,
      ccUserIds: readStringArray(node.ccUserIds)
    })),
    createdBy: {
      id: record.createdBy.id,
      displayName: record.createdBy.displayName
    },
    updatedBy: {
      id: record.updatedBy.id,
      displayName: record.updatedBy.displayName
    },
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapWorkflowInstance(record: WorkflowInstanceRecord) {
  return {
    id: record.id,
    title: record.title,
    businessKey: record.businessKey ?? null,
    status: record.status,
    currentNodeKey: record.currentNodeKey ?? null,
    template: {
      id: record.template.id,
      key: record.template.key,
      name: record.template.name,
      version: record.template.version
    },
    applicant: {
      id: record.applicant.id,
      displayName: record.applicant.displayName
    },
    formData: readRecordObject(record.formData),
    tasks: record.tasks.map((task) => ({
      id: task.id,
      nodeKey: task.nodeKey,
      nodeName: task.nodeName,
      isAddSign: task.isAddSign,
      status: task.status,
      assignee: {
        id: task.assignee.id,
        displayName: task.assignee.displayName
      },
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            displayName: task.createdBy.displayName
          }
        : null,
      createdAt: toIsoString(task.createdAt)!,
      decidedAt: toIsoString(task.decidedAt) ?? null
    })),
    actions: record.actions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      actor: {
        id: action.actor.id,
        displayName: action.actor.displayName
      },
      comment: action.comment ?? null,
      payload: action.payload ?? null,
      createdAt: toIsoString(action.createdAt)!
    })),
    ccRecipients: record.ccRecipients.map((item) => ({
      id: item.id,
      user: {
        id: item.user.id,
        displayName: item.user.displayName
      },
      createdBy: {
        id: item.createdBy.id,
        displayName: item.createdBy.displayName
      },
      sourceNodeKey: item.sourceNodeKey ?? null,
      createdAt: toIsoString(item.createdAt)!
    })),
    submittedAt: toIsoString(record.submittedAt)!,
    completedAt: toIsoString(record.completedAt) ?? null,
    createdAt: toIsoString(record.createdAt)!,
    updatedAt: toIsoString(record.updatedAt)!
  };
}

export function mapWorkflowPendingTask(record: WorkflowPendingTaskRecord) {
  return {
    id: record.id,
    instanceId: record.instance.id,
    nodeKey: record.nodeKey,
    nodeName: record.nodeName,
    title: record.instance.title,
    businessKey: record.instance.businessKey ?? null,
    status: record.instance.status,
    submittedAt: toIsoString(record.instance.submittedAt)!,
    template: {
      id: record.instance.template.id,
      key: record.instance.template.key,
      name: record.instance.template.name,
      version: record.instance.template.version
    },
    applicant: {
      id: record.instance.applicant.id,
      displayName: record.instance.applicant.displayName
    },
    formData: readRecordObject(record.instance.formData)
  };
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
}

function readRecordObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
