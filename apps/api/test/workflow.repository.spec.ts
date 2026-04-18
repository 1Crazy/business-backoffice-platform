import {
  UserStatus,
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowTaskStatus
} from "@prisma/client";

import { WorkflowRepository } from "../src/modules/workflow/repositories/workflow.repository";

describe("WorkflowRepository", () => {
  it("reads workflow templates only inside the current tenant", async () => {
    const prisma = {
      workflowTemplate: {
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: "template-1" })
      }
    } as any;
    const repository = new WorkflowRepository(prisma);

    await repository.findTemplateById("template-1", "tenant-1");

    expect(prisma.workflowTemplate.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "template-1",
        tenantId: "tenant-1"
      },
      include: expect.any(Object)
    });
  });

  it("resolves permission assignees only inside the current tenant", async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([])
      }
    } as any;
    const repository = new WorkflowRepository(prisma);

    await repository.listUsersByPermission("oa:workflow:write", "tenant-1");

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-1",
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    code: "oa:workflow:write"
                  }
                }
              }
            }
          }
        }
      },
      select: expect.any(Object),
      orderBy: {
        createdAt: "asc"
      }
    });
  });

  it("advances workflow tasks with tenant-scoped updates and writes", async () => {
    const tx = {
      workflowTask: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      workflowAction: {
        create: jest.fn().mockResolvedValue(undefined)
      },
      workflowInstance: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      workflowCcRecipient: {
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
    } as any;
    const repository = new WorkflowRepository(prisma);

    jest.spyOn(repository, "findInstanceById").mockResolvedValue({ id: "instance-1" } as any);

    await repository.approveTask({
      tenantId: "tenant-1",
      instanceId: "instance-1",
      taskId: "task-1",
      actorId: "approver-1",
      comment: "通过",
      nextNode: {
        id: "node-2",
        nodeKey: "finance-review",
        nodeName: "财务复核",
        assigneeIds: ["approver-2"]
      },
      nextNodeCcRecipients: [
        {
          userId: "cc-1",
          createdById: "approver-1",
          sourceNodeKey: "finance-review"
        }
      ],
      completeInstance: false
    });

    expect(tx.workflowTask.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        tenantId: "tenant-1"
      },
      data: {
        status: WorkflowTaskStatus.APPROVED,
        decidedAt: expect.any(Date)
      }
    });
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        instanceId: "instance-1",
        taskId: "task-1",
        actorId: "approver-1",
        actionType: WorkflowActionType.APPROVED,
        comment: "通过"
      }
    });
    expect(tx.workflowInstance.updateMany).toHaveBeenCalledWith({
      where: {
        id: "instance-1",
        tenantId: "tenant-1"
      },
      data: {
        currentNodeKey: "finance-review"
      }
    });
    expect(tx.workflowTask.createMany).toHaveBeenCalledWith({
      data: [
        {
          tenantId: "tenant-1",
          instanceId: "instance-1",
          templateNodeId: "node-2",
          nodeKey: "finance-review",
          nodeName: "财务复核",
          assigneeId: "approver-2",
          createdById: "approver-1"
        }
      ]
    });
    expect(tx.workflowCcRecipient.createMany).toHaveBeenCalledWith({
      data: [
        {
          tenantId: "tenant-1",
          instanceId: "instance-1",
          userId: "cc-1",
          createdById: "approver-1",
          sourceNodeKey: "finance-review"
        }
      ]
    });
  });
});
