import {
  WorkflowAssignmentType,
  WorkflowInstanceStatus,
  WorkflowTaskStatus,
  WorkflowTemplateStatus
} from "@prisma/client";

import { WorkflowService } from "../src/modules/workflow/workflow.service";

describe("WorkflowService", () => {
  const mockRepository = {
    listTemplates: vi.fn(),
    findTemplateById: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    updateTemplateStatus: vi.fn(),
    listUsersByIds: vi.fn(),
    listUsersByPermission: vi.fn(),
    createWorkflowInstance: vi.fn(),
    findInstanceById: vi.fn(),
    findTaskById: vi.fn(),
    approveTask: vi.fn(),
    rejectTask: vi.fn(),
    transferTask: vi.fn(),
    addSignTask: vi.fn(),
    addCcRecipients: vi.fn(),
    closeInstance: vi.fn()
  };
  const mockAuditLogs = {
    create: vi.fn()
  };
  const mockOpenIntegration = {
    dispatchBusinessWebhookEvent: vi.fn().mockResolvedValue(undefined)
  };

  const service = new WorkflowService(mockRepository as any, mockAuditLogs as any, mockOpenIntegration as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a workflow template and records audit log", async () => {
    mockRepository.createTemplate.mockResolvedValue(
      buildTemplateRecord({
        id: "template-1",
        key: "leave-v2",
        status: WorkflowTemplateStatus.DRAFT
      })
    );

    const result = await service.createTemplate(
      {
        key: "leave-v2",
        name: "请假流程 V2",
        businessType: "LEAVE",
        formSchema: {
          fields: ["leaveType", "days"]
        },
        nodes: [
          {
            nodeKey: "leader-approval",
            name: "直属领导审批",
            position: 1,
            assignmentType: WorkflowAssignmentType.USER,
            assignmentConfig: {
              userIds: ["leader-1"]
            }
          }
        ]
      },
      buildActor()
    );

    expect(mockRepository.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        key: "leave-v2",
        createdById: "user-1",
        nodes: [
          expect.objectContaining({
            nodeKey: "leader-approval",
            assignmentType: WorkflowAssignmentType.USER
          })
        ]
      })
    );
    expect(mockAuditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "workflow-template",
        targetId: "template-1"
      })
    );
    expect(result.key).toBe("leave-v2");
  });

  it("starts a workflow instance with initial approver and merged cc recipients", async () => {
    mockRepository.findTemplateById.mockResolvedValue(
      buildTemplateRecord({
        id: "template-2",
        key: "reimbursement-v2",
        status: WorkflowTemplateStatus.ACTIVE,
        defaultCcUserIds: ["cc-1"],
        nodes: [
          {
            id: "node-1",
            nodeKey: "finance-review",
            name: "财务初审",
            position: 1,
            assignmentType: WorkflowAssignmentType.USER,
            assignmentConfig: {
              userIds: ["approver-1"]
            },
            ccUserIds: ["cc-2"]
          }
        ]
      })
    );
    mockRepository.listUsersByIds.mockResolvedValue([{ id: "approver-1", displayName: "财务一号" }]);
    mockRepository.createWorkflowInstance.mockResolvedValue(
      buildInstanceRecord({
        id: "instance-1",
        currentNodeKey: "finance-review"
      })
    );

    const result = await service.startInstance(
      "template-2",
      {
        title: "四月差旅报销",
        formData: {
          amount: 2600
        },
        ccUserIds: ["cc-3"]
      },
      buildActor()
    );

    expect(mockRepository.findTemplateById).toHaveBeenCalledWith("template-2", "tenant-1");
    expect(mockRepository.listUsersByIds).toHaveBeenCalledWith(["approver-1"], "tenant-1");
    expect(mockRepository.createWorkflowInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        templateId: "template-2",
        assigneeIds: ["approver-1"],
        ccRecipients: expect.arrayContaining([
          expect.objectContaining({ userId: "cc-1", sourceNodeKey: null }),
          expect.objectContaining({ userId: "cc-2", sourceNodeKey: "finance-review" }),
          expect.objectContaining({ userId: "cc-3", sourceNodeKey: "finance-review" })
        ])
      })
    );
    expect(result.id).toBe("instance-1");
  });

  it("approves a task and advances to the conditional next node", async () => {
    mockRepository.findTaskById.mockResolvedValue(
      buildTaskRecord({
        id: "task-1",
        assignee: {
          id: "approver-1",
          displayName: "经理"
        },
        templateNode: {
          id: "node-1",
          nodeKey: "manager-approval",
          name: "经理审批",
          position: 1,
          assignmentType: WorkflowAssignmentType.USER,
          assignmentConfig: { userIds: ["manager-1"] },
          branchRules: [
            {
              field: "amount",
              operator: "GTE",
              value: 1000,
              nextNodeKey: "finance-approval"
            }
          ]
        },
        instance: buildInstanceRecord({
          id: "instance-2",
          formData: {
            amount: 1600
          },
          tasks: [
            buildTaskSummary({
              id: "task-1",
              nodeKey: "manager-approval",
              assigneeId: "approver-1",
              assigneeName: "经理"
            })
          ],
          template: buildTemplateRecord({
            nodes: [
              {
                id: "node-1",
                nodeKey: "manager-approval",
                name: "经理审批",
                position: 1,
                assignmentType: WorkflowAssignmentType.USER,
                assignmentConfig: { userIds: ["approver-1"] },
                branchRules: [
                  {
                    field: "amount",
                    operator: "GTE",
                    value: 1000,
                    nextNodeKey: "finance-approval"
                  }
                ]
              },
              {
                id: "node-2",
                nodeKey: "finance-approval",
                name: "财务审批",
                position: 2,
                assignmentType: WorkflowAssignmentType.USER,
                assignmentConfig: { userIds: ["approver-2"] },
                ccUserIds: ["cc-10"]
              }
            ]
          })
        })
      })
    );
    mockRepository.listUsersByIds.mockResolvedValue([{ id: "approver-2", displayName: "财务主管" }]);
    mockRepository.approveTask.mockResolvedValue(
      buildInstanceRecord({
        id: "instance-2",
        currentNodeKey: "finance-approval"
      })
    );

    const result = await service.approveTask(
      "task-1",
      {
        comment: "通过"
      },
      buildActor({
        id: "approver-1",
        displayName: "经理"
      })
    );

    expect(mockRepository.findTaskById).toHaveBeenCalledWith("task-1", "tenant-1");
    expect(mockRepository.listUsersByIds).toHaveBeenCalledWith(["approver-2"], "tenant-1");
    expect(mockRepository.approveTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        taskId: "task-1",
        nextNode: expect.objectContaining({
          nodeKey: "finance-approval",
          assigneeIds: ["approver-2"]
        }),
        nextNodeCcRecipients: [expect.objectContaining({ userId: "cc-10", sourceNodeKey: "finance-approval" })],
        completeInstance: false
      })
    );
    expect(mockOpenIntegration.dispatchBusinessWebhookEvent).not.toHaveBeenCalled();
    expect(result.currentNodeKey).toBe("finance-approval");
  });

  it("publishes a webhook event when workflow instance is completed", async () => {
    mockRepository.findTaskById.mockResolvedValue(
      buildTaskRecord({
        id: "task-complete-1",
        assignee: {
          id: "approver-1",
          displayName: "经理"
        },
        templateNode: {
          id: "node-1",
          nodeKey: "manager-approval",
          name: "经理审批",
          position: 1,
          assignmentType: WorkflowAssignmentType.USER,
          assignmentConfig: { userIds: ["approver-1"] },
          branchRules: []
        },
        instance: buildInstanceRecord({
          id: "instance-complete-1",
          title: "请假审批",
          template: buildTemplateRecord({
            id: "template-wf-1",
            key: "leave-v2",
            nodes: [
              {
                id: "node-1",
                nodeKey: "manager-approval",
                name: "经理审批",
                position: 1,
                assignmentType: WorkflowAssignmentType.USER,
                assignmentConfig: { userIds: ["approver-1"] },
                branchRules: []
              }
            ]
          }),
          tasks: [
            buildTaskSummary({
              id: "task-complete-1",
              nodeKey: "manager-approval",
              assigneeId: "approver-1",
              assigneeName: "经理"
            })
          ]
        })
      })
    );
    mockRepository.approveTask.mockResolvedValue(
      buildInstanceRecord({
        id: "instance-complete-1",
        title: "请假审批",
        status: WorkflowInstanceStatus.APPROVED,
        currentNodeKey: null,
        completedAt: new Date("2026-04-16T11:00:00.000Z"),
        template: buildTemplateRecord({
          id: "template-wf-1",
          key: "leave-v2"
        })
      })
    );

    await service.approveTask(
      "task-complete-1",
      {
        comment: "通过"
      },
      buildActor({
        id: "approver-1",
        displayName: "经理"
      })
    );

    expect(mockOpenIntegration.dispatchBusinessWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        eventType: "WORKFLOW_INSTANCE_COMPLETED",
        sourceType: "workflow-instance",
        sourceId: "instance-complete-1"
      })
    );
  });

  it("transfers and add-signs pending tasks", async () => {
    const baseTask = buildTaskRecord({
      id: "task-3",
      assignee: {
        id: "approver-3",
        displayName: "采购主管"
      },
      templateNode: {
        id: "node-3",
        nodeKey: "purchase-review",
        name: "采购审批",
        position: 1,
        assignmentType: WorkflowAssignmentType.USER,
        assignmentConfig: {
          userIds: ["approver-3"]
        },
        allowAddSign: true,
        allowTransfer: true
      },
      instance: buildInstanceRecord({
        id: "instance-3"
      })
    });

    mockRepository.findTaskById.mockResolvedValue(baseTask);
    mockRepository.listUsersByIds.mockResolvedValue([{ id: "approver-4", displayName: "运营主管" }]);
    mockRepository.transferTask.mockResolvedValue(buildInstanceRecord({ id: "instance-3" }));

    await service.transferTask(
      "task-3",
      {
        assigneeId: "approver-4",
        comment: "改由运营主管处理"
      },
      buildActor({
        id: "approver-3",
        displayName: "采购主管"
      })
    );

    expect(mockRepository.findTaskById).toHaveBeenCalledWith("task-3", "tenant-1");
    expect(mockRepository.listUsersByIds).toHaveBeenCalledWith(["approver-4"], "tenant-1");
    expect(mockRepository.transferTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        taskId: "task-3",
        assigneeId: "approver-4"
      })
    );

    mockRepository.findTaskById.mockResolvedValue(baseTask);
    mockRepository.addSignTask.mockResolvedValue(buildInstanceRecord({ id: "instance-3" }));

    await service.addSignTask(
      "task-3",
      {
        assigneeId: "approver-4",
        comment: "补充运营会签"
      },
      buildActor({
        id: "approver-3",
        displayName: "采购主管"
      })
    );

    expect(mockRepository.findTaskById).toHaveBeenCalledWith("task-3", "tenant-1");
    expect(mockRepository.addSignTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        taskId: "task-3",
        assigneeId: "approver-4"
      })
    );
  });
});

function buildActor(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: "user-1",
    tenantId: "tenant-1",
    username: "alice",
    displayName: "Alice",
    roleCodes: ["oa-member"],
    permissions: ["oa:workflow:read", "oa:workflow:apply", "oa:workflow:write", "oa:workflow-template:write"],
    ...overrides
  };
}

function buildTemplateRecord(overrides: Partial<Record<string, any>> = {}) {
  const createdAt = new Date("2026-04-16T08:00:00.000Z");

  return {
    id: "template-default",
    key: "workflow-default",
    name: "默认流程",
    description: "默认流程描述",
    businessType: "GENERAL",
    version: 1,
    status: WorkflowTemplateStatus.ACTIVE,
    formSchema: {
      fields: ["title"]
    },
    defaultCcUserIds: [],
    createdBy: {
      id: "admin-1",
      displayName: "管理员"
    },
    updatedBy: {
      id: "admin-1",
      displayName: "管理员"
    },
    nodes: [
      {
        id: "node-default",
        nodeKey: "node-default",
        name: "默认审批",
        nodeType: "APPROVAL",
        position: 1,
        assignmentType: WorkflowAssignmentType.USER,
        assignmentConfig: {
          userIds: ["approver-1"]
        },
        branchRules: [],
        fallbackNodeKey: null,
        allowAddSign: true,
        allowTransfer: true,
        ccUserIds: [],
        createdAt,
        updatedAt: createdAt
      }
    ],
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

function buildTaskSummary(overrides: Partial<Record<string, any>> = {}) {
  const createdAt = new Date("2026-04-16T09:00:00.000Z");

  return {
    id: "task-summary",
    nodeKey: "node-default",
    nodeName: "默认审批",
    isAddSign: false,
    status: WorkflowTaskStatus.PENDING,
    assignee: {
      id: "approver-1",
      displayName: "审批人"
    },
    createdBy: {
      id: "user-1",
      displayName: "Alice"
    },
    createdAt,
    updatedAt: createdAt,
    decidedAt: null,
    ...("assigneeId" in overrides || "assigneeName" in overrides
      ? {
          assignee: {
            id: overrides.assigneeId ?? "approver-1",
            displayName: overrides.assigneeName ?? "审批人"
          }
        }
      : {}),
    ...overrides
  };
}

function buildInstanceRecord(overrides: Partial<Record<string, any>> = {}) {
  const createdAt = new Date("2026-04-16T09:00:00.000Z");

  return {
    id: "instance-default",
    title: "默认流程实例",
    businessKey: null,
    formData: {
      amount: 100
    },
    currentNodeKey: "node-default",
    status: WorkflowInstanceStatus.IN_PROGRESS,
    submittedAt: createdAt,
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
    template: buildTemplateRecord(),
    applicant: {
      id: "user-1",
      displayName: "Alice"
    },
    tasks: [buildTaskSummary()],
    actions: [],
    ccRecipients: [],
    ...overrides
  };
}

function buildTaskRecord(overrides: Partial<Record<string, any>> = {}) {
  const createdAt = new Date("2026-04-16T09:00:00.000Z");

  return {
    id: "task-default",
    instanceId: "instance-default",
    templateNodeId: "node-default",
    nodeKey: "node-default",
    nodeName: "默认审批",
    assignee: {
      id: "user-1",
      displayName: "Alice"
    },
    createdBy: {
      id: "user-1",
      displayName: "Alice"
    },
    sourceTaskId: null,
    isAddSign: false,
    status: WorkflowTaskStatus.PENDING,
    decidedAt: null,
    createdAt,
    updatedAt: createdAt,
    templateNode: {
      id: "node-default",
      nodeKey: "node-default",
      name: "默认审批",
      nodeType: "APPROVAL",
      position: 1,
      assignmentType: WorkflowAssignmentType.USER,
      assignmentConfig: {
        userIds: ["user-1"]
      },
      branchRules: [],
      fallbackNodeKey: null,
      allowAddSign: true,
      allowTransfer: true,
      ccUserIds: [],
      createdAt,
      updatedAt: createdAt
    },
    instance: buildInstanceRecord(),
    ...overrides
  };
}
