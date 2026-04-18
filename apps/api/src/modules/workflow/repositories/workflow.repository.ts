/** workflow 模块 repository：负责流程模板、实例与任务动作的 Prisma 查询和事务写入。 */
import { Injectable } from "@nestjs/common";
import {
  Prisma,
  UserStatus,
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowTaskStatus,
  WorkflowTemplateStatus
} from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const workflowUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  displayName: true
});

const workflowTemplateNodeSelect = Prisma.validator<Prisma.WorkflowTemplateNodeSelect>()({
  id: true,
  nodeKey: true,
  name: true,
  nodeType: true,
  position: true,
  assignmentType: true,
  assignmentConfig: true,
  branchRules: true,
  fallbackNodeKey: true,
  allowAddSign: true,
  allowTransfer: true,
  ccUserIds: true,
  createdAt: true,
  updatedAt: true
});

const workflowTemplateInclude = Prisma.validator<Prisma.WorkflowTemplateInclude>()({
  createdBy: {
    select: workflowUserSelect
  },
  updatedBy: {
    select: workflowUserSelect
  },
  nodes: {
    select: workflowTemplateNodeSelect,
    orderBy: {
      position: "asc"
    }
  }
});

const workflowActionInclude = Prisma.validator<Prisma.WorkflowActionInclude>()({
  actor: {
    select: workflowUserSelect
  }
});

const workflowTaskInclude = Prisma.validator<Prisma.WorkflowTaskInclude>()({
  assignee: {
    select: workflowUserSelect
  },
  createdBy: {
    select: workflowUserSelect
  },
  templateNode: {
    select: workflowTemplateNodeSelect
  }
});

const workflowPendingTaskInclude = Prisma.validator<Prisma.WorkflowTaskInclude>()({
  assignee: {
    select: workflowUserSelect
  },
  templateNode: {
    select: workflowTemplateNodeSelect
  },
  instance: {
    include: {
      template: {
        include: workflowTemplateInclude
      },
      applicant: {
        select: workflowUserSelect
      },
      tasks: {
        include: workflowTaskInclude,
        orderBy: {
          createdAt: "asc"
        }
      },
      actions: {
        include: workflowActionInclude,
        orderBy: {
          createdAt: "asc"
        }
      },
      ccRecipients: {
        include: {
          user: {
            select: workflowUserSelect
          },
          createdBy: {
            select: workflowUserSelect
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  }
});

const workflowInstanceInclude = Prisma.validator<Prisma.WorkflowInstanceInclude>()({
  template: {
    include: workflowTemplateInclude
  },
  applicant: {
    select: workflowUserSelect
  },
  tasks: {
    include: workflowTaskInclude,
    orderBy: {
      createdAt: "asc"
    }
  },
  actions: {
    include: workflowActionInclude,
    orderBy: {
      createdAt: "asc"
    }
  },
  ccRecipients: {
    include: {
      user: {
        select: workflowUserSelect
      },
      createdBy: {
        select: workflowUserSelect
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  }
});

export type WorkflowTemplateRecord = Prisma.WorkflowTemplateGetPayload<{
  include: typeof workflowTemplateInclude;
}>;

export type WorkflowInstanceRecord = Prisma.WorkflowInstanceGetPayload<{
  include: typeof workflowInstanceInclude;
}>;

export type WorkflowTaskRecord = Prisma.WorkflowTaskGetPayload<{
  include: {
    assignee: {
      select: typeof workflowUserSelect;
    };
    createdBy: {
      select: typeof workflowUserSelect;
    };
    templateNode: {
      select: typeof workflowTemplateNodeSelect;
    };
    instance: {
      include: typeof workflowInstanceInclude;
    };
  };
}>;

export type WorkflowPendingTaskRecord = Prisma.WorkflowTaskGetPayload<{
  include: typeof workflowPendingTaskInclude;
}>;

@Injectable()
export class WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  listTemplates(tenantId: string, status?: WorkflowTemplateStatus) {
    return this.prisma.workflowTemplate.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {})
      },
      include: workflowTemplateInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });
  }

  findTemplateById(id: string, tenantId: string) {
    return this.prisma.workflowTemplate.findFirstOrThrow({
      where: { id, tenantId },
      include: workflowTemplateInclude
    });
  }

  findTemplateByKey(key: string, tenantId: string) {
    return this.prisma.workflowTemplate.findFirstOrThrow({
      where: { key, tenantId },
      include: workflowTemplateInclude
    });
  }

  async createTemplate(input: {
    tenantId: string;
    key: string;
    name: string;
    description?: string | null;
    businessType: string;
    formSchema: Prisma.InputJsonValue;
    defaultCcUserIds?: Prisma.InputJsonValue;
    status: WorkflowTemplateStatus;
    createdById: string;
    updatedById: string;
    nodes: Array<{
      nodeKey: string;
      name: string;
      nodeType: WorkflowTemplateRecord["nodes"][number]["nodeType"];
      position: number;
      assignmentType: WorkflowTemplateRecord["nodes"][number]["assignmentType"];
      assignmentConfig: Prisma.InputJsonValue;
      branchRules?: Prisma.InputJsonValue;
      fallbackNodeKey?: string | null;
      allowAddSign: boolean;
      allowTransfer: boolean;
      ccUserIds?: Prisma.InputJsonValue;
    }>;
  }) {
    const template = await this.prisma.workflowTemplate.create({
      data: {
        tenantId: input.tenantId,
        key: input.key,
        name: input.name,
        description: input.description ?? undefined,
        businessType: input.businessType,
        formSchema: input.formSchema,
        defaultCcUserIds: input.defaultCcUserIds,
        status: input.status,
        createdById: input.createdById,
        updatedById: input.updatedById,
        nodes: {
          create: input.nodes.map((node) => ({
            tenantId: input.tenantId,
            nodeKey: node.nodeKey,
            name: node.name,
            nodeType: node.nodeType,
            position: node.position,
            assignmentType: node.assignmentType,
            assignmentConfig: node.assignmentConfig,
            branchRules: node.branchRules,
            fallbackNodeKey: node.fallbackNodeKey ?? undefined,
            allowAddSign: node.allowAddSign,
            allowTransfer: node.allowTransfer,
            ccUserIds: node.ccUserIds
          }))
        }
      }
    });

    return this.findTemplateById(template.id, input.tenantId);
  }

  async updateTemplate(
    id: string,
    tenantId: string,
    input: {
      name: string;
      description?: string | null;
      businessType: string;
      formSchema: Prisma.InputJsonValue;
      defaultCcUserIds?: Prisma.InputJsonValue;
      updatedById: string;
      nodes: Array<{
        nodeKey: string;
        name: string;
        nodeType: WorkflowTemplateRecord["nodes"][number]["nodeType"];
        position: number;
        assignmentType: WorkflowTemplateRecord["nodes"][number]["assignmentType"];
        assignmentConfig: Prisma.InputJsonValue;
        branchRules?: Prisma.InputJsonValue;
        fallbackNodeKey?: string | null;
        allowAddSign: boolean;
        allowTransfer: boolean;
        ccUserIds?: Prisma.InputJsonValue;
      }>;
    }
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTemplate.findFirstOrThrow({
        where: {
          id,
          tenantId
        },
        select: {
          id: true
        }
      });

      await tx.workflowTemplateNode.deleteMany({
        where: {
          templateId: id,
          tenantId
        }
      });

      await tx.workflowTemplate.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description ?? undefined,
          businessType: input.businessType,
          formSchema: input.formSchema,
          defaultCcUserIds: input.defaultCcUserIds,
          updatedById: input.updatedById,
          nodes: {
            create: input.nodes.map((node) => ({
              tenantId,
              nodeKey: node.nodeKey,
              name: node.name,
              nodeType: node.nodeType,
              position: node.position,
              assignmentType: node.assignmentType,
              assignmentConfig: node.assignmentConfig,
              branchRules: node.branchRules,
              fallbackNodeKey: node.fallbackNodeKey ?? undefined,
              allowAddSign: node.allowAddSign,
              allowTransfer: node.allowTransfer,
              ccUserIds: node.ccUserIds
            }))
          }
        }
      });
    });

    return this.findTemplateById(id, tenantId);
  }

  async updateTemplateStatus(id: string, tenantId: string, status: WorkflowTemplateStatus, updatedById: string) {
    await this.prisma.workflowTemplate.updateMany({
      where: { id, tenantId },
      data: {
        status,
        updatedById
      }
    });

    return this.findTemplateById(id, tenantId);
  }

  listUsersByIds(userIds: string[], tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        id: {
          in: userIds
        },
        status: UserStatus.ACTIVE
      },
      select: workflowUserSelect
    });
  }

  listUsersByPermission(permissionCode: string, tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    code: permissionCode
                  }
                }
              }
            }
          }
        }
      },
      select: workflowUserSelect,
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  findInstanceById(id: string, tenantId: string) {
    return this.prisma.workflowInstance.findFirstOrThrow({
      where: { id, tenantId },
      include: workflowInstanceInclude
    });
  }

  listInstancesByApplicant(applicantId: string, tenantId: string) {
    return this.prisma.workflowInstance.findMany({
      where: {
        tenantId,
        applicantId
      },
      include: workflowInstanceInclude,
      orderBy: [
        {
          submittedAt: "desc"
        }
      ]
    });
  }

  listPendingTasks(assigneeId: string, tenantId: string) {
    return this.prisma.workflowTask.findMany({
      where: {
        tenantId,
        assigneeId,
        status: WorkflowTaskStatus.PENDING,
        instance: {
          tenantId,
          status: WorkflowInstanceStatus.IN_PROGRESS
        }
      },
      include: workflowPendingTaskInclude,
      orderBy: [
        {
          createdAt: "desc"
        }
      ]
    });
  }

  findTaskById(id: string, tenantId: string) {
    return this.prisma.workflowTask.findFirstOrThrow({
      where: { id, tenantId },
      include: {
        assignee: {
          select: workflowUserSelect
        },
        createdBy: {
          select: workflowUserSelect
        },
        templateNode: {
          select: workflowTemplateNodeSelect
        },
        instance: {
          include: workflowInstanceInclude
        }
      }
    });
  }

  async createWorkflowInstance(input: {
    tenantId: string;
    templateId: string;
    applicantId: string;
    businessKey?: string | null;
    title: string;
    formData: Prisma.InputJsonValue;
    currentNodeKey: string;
    initialNodeId: string;
    initialNodeName: string;
    assigneeIds: string[];
    ccRecipients: Array<{
      userId: string;
      createdById: string;
      sourceNodeKey?: string | null;
    }>;
  }) {
    let instanceId = "";
    await this.prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          tenantId: input.tenantId,
          templateId: input.templateId,
          applicantId: input.applicantId,
          businessKey: input.businessKey ?? undefined,
          title: input.title,
          formData: input.formData,
          currentNodeKey: input.currentNodeKey
        }
      });
      instanceId = instance.id;

      await tx.workflowTask.createMany({
        data: input.assigneeIds.map((assigneeId) => ({
          tenantId: input.tenantId,
          instanceId,
          templateNodeId: input.initialNodeId,
          nodeKey: input.currentNodeKey,
          nodeName: input.initialNodeName,
          assigneeId,
          createdById: input.applicantId
        }))
      });

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId,
          actorId: input.applicantId,
          actionType: WorkflowActionType.SUBMITTED,
          payload: {
            currentNodeKey: input.currentNodeKey
          }
        }
      });

      if (input.ccRecipients.length) {
        await tx.workflowCcRecipient.createMany({
          data: input.ccRecipients
            .filter((item, index, array) => array.findIndex((target) => target.userId === item.userId && target.sourceNodeKey === item.sourceNodeKey) === index)
            .map((item) => ({
              tenantId: input.tenantId,
              instanceId,
              userId: item.userId,
              createdById: item.createdById,
              sourceNodeKey: item.sourceNodeKey ?? undefined
            }))
        });
      }
    });

    return this.findInstanceById(instanceId, input.tenantId);
  }

  async approveTask(input: {
    tenantId: string;
    instanceId: string;
    taskId: string;
    actorId: string;
    comment?: string;
    nextNode?: {
      id: string;
      nodeKey: string;
      nodeName: string;
      assigneeIds: string[];
    } | null;
    nextNodeCcRecipients?: Array<{
      userId: string;
      createdById: string;
      sourceNodeKey?: string | null;
    }>;
    completeInstance?: boolean;
  }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTask.updateMany({
        where: { id: input.taskId, tenantId: input.tenantId },
        data: {
          status: WorkflowTaskStatus.APPROVED,
          decidedAt: new Date()
        }
      });

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          taskId: input.taskId,
          actorId: input.actorId,
          actionType: WorkflowActionType.APPROVED,
          comment: input.comment
        }
      });

      if (input.completeInstance) {
        await tx.workflowInstance.updateMany({
          where: { id: input.instanceId, tenantId: input.tenantId },
          data: {
            status: WorkflowInstanceStatus.APPROVED,
            currentNodeKey: null,
            completedAt: new Date()
          }
        });

        return;
      }

      if (!input.nextNode) {
        return;
      }

      await tx.workflowInstance.updateMany({
        where: { id: input.instanceId, tenantId: input.tenantId },
        data: {
          currentNodeKey: input.nextNode.nodeKey
        }
      });

      await tx.workflowTask.createMany({
        data: input.nextNode.assigneeIds.map((assigneeId) => ({
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          templateNodeId: input.nextNode?.id,
          nodeKey: input.nextNode?.nodeKey ?? "",
          nodeName: input.nextNode?.nodeName ?? "",
          assigneeId,
          createdById: input.actorId
        }))
      });

      if (input.nextNodeCcRecipients?.length) {
        await tx.workflowCcRecipient.createMany({
          data: input.nextNodeCcRecipients
            .filter((item, index, array) => array.findIndex((target) => target.userId === item.userId && target.sourceNodeKey === item.sourceNodeKey) === index)
            .map((item) => ({
              tenantId: input.tenantId,
              instanceId: input.instanceId,
              userId: item.userId,
              createdById: item.createdById,
              sourceNodeKey: item.sourceNodeKey ?? undefined
            }))
        });
      }
    });

    return this.findInstanceById(input.instanceId, input.tenantId);
  }

  async rejectTask(input: {
    tenantId: string;
    instanceId: string;
    taskId: string;
    actorId: string;
    comment?: string;
    cancelTaskIds: string[];
  }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTask.updateMany({
        where: { id: input.taskId, tenantId: input.tenantId },
        data: {
          status: WorkflowTaskStatus.REJECTED,
          decidedAt: new Date()
        }
      });

      if (input.cancelTaskIds.length) {
        await tx.workflowTask.updateMany({
          where: {
            tenantId: input.tenantId,
            id: {
              in: input.cancelTaskIds
            }
          },
          data: {
            status: WorkflowTaskStatus.CANCELLED,
            decidedAt: new Date()
          }
        });
      }

      await tx.workflowInstance.updateMany({
        where: { id: input.instanceId, tenantId: input.tenantId },
        data: {
          status: WorkflowInstanceStatus.REJECTED,
          currentNodeKey: null,
          completedAt: new Date()
        }
      });

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          taskId: input.taskId,
          actorId: input.actorId,
          actionType: WorkflowActionType.REJECTED,
          comment: input.comment
        }
      });
    });

    return this.findInstanceById(input.instanceId, input.tenantId);
  }

  async transferTask(input: {
    tenantId: string;
    instanceId: string;
    taskId: string;
    actorId: string;
    assigneeId: string;
    comment?: string;
    templateNodeId?: string | null;
    nodeKey: string;
    nodeName: string;
  }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTask.updateMany({
        where: { id: input.taskId, tenantId: input.tenantId },
        data: {
          status: WorkflowTaskStatus.TRANSFERRED,
          decidedAt: new Date()
        }
      });

      await tx.workflowTask.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          templateNodeId: input.templateNodeId ?? undefined,
          nodeKey: input.nodeKey,
          nodeName: input.nodeName,
          assigneeId: input.assigneeId,
          createdById: input.actorId,
          sourceTaskId: input.taskId
        }
      });

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          taskId: input.taskId,
          actorId: input.actorId,
          actionType: WorkflowActionType.TRANSFERRED,
          comment: input.comment,
          payload: {
            assigneeId: input.assigneeId
          }
        }
      });
    });

    return this.findInstanceById(input.instanceId, input.tenantId);
  }

  async addSignTask(input: {
    tenantId: string;
    instanceId: string;
    taskId: string;
    actorId: string;
    assigneeId: string;
    comment?: string;
    templateNodeId?: string | null;
    nodeKey: string;
    nodeName: string;
  }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTask.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          templateNodeId: input.templateNodeId ?? undefined,
          nodeKey: input.nodeKey,
          nodeName: input.nodeName,
          assigneeId: input.assigneeId,
          createdById: input.actorId,
          sourceTaskId: input.taskId,
          isAddSign: true
        }
      });

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          taskId: input.taskId,
          actorId: input.actorId,
          actionType: WorkflowActionType.ADDED_SIGN,
          comment: input.comment,
          payload: {
            assigneeId: input.assigneeId
          }
        }
      });
    });

    return this.findInstanceById(input.instanceId, input.tenantId);
  }

  async addCcRecipients(input: {
    tenantId: string;
    instanceId: string;
    actorId: string;
    comment?: string;
    recipients: Array<{
      userId: string;
      sourceNodeKey?: string | null;
    }>;
  }) {
    await this.prisma.$transaction(async (tx) => {
      if (input.recipients.length) {
        await tx.workflowCcRecipient.createMany({
          data: input.recipients
            .filter((item, index, array) => array.findIndex((target) => target.userId === item.userId && target.sourceNodeKey === item.sourceNodeKey) === index)
            .map((item) => ({
              tenantId: input.tenantId,
              instanceId: input.instanceId,
              userId: item.userId,
              createdById: input.actorId,
              sourceNodeKey: item.sourceNodeKey ?? undefined
            }))
        });
      }

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          actorId: input.actorId,
          actionType: WorkflowActionType.CC,
          comment: input.comment,
          payload: {
            recipientIds: input.recipients.map((item) => item.userId)
          }
        }
      });
    });

    return this.findInstanceById(input.instanceId, input.tenantId);
  }

  async closeInstance(input: {
    tenantId: string;
    instanceId: string;
    actorId: string;
    actionType: "CANCELLED" | "TERMINATED";
    status: "CANCELLED" | "TERMINATED";
    comment?: string;
    cancelTaskIds: string[];
  }) {
    await this.prisma.$transaction(async (tx) => {
      if (input.cancelTaskIds.length) {
        await tx.workflowTask.updateMany({
          where: {
            tenantId: input.tenantId,
            id: {
              in: input.cancelTaskIds
            }
          },
          data: {
            status: WorkflowTaskStatus.CANCELLED,
            decidedAt: new Date()
          }
        });
      }

      await tx.workflowInstance.updateMany({
        where: {
          id: input.instanceId,
          tenantId: input.tenantId
        },
        data: {
          status: input.status,
          currentNodeKey: null,
          completedAt: new Date()
        }
      });

      await tx.workflowAction.create({
        data: {
          tenantId: input.tenantId,
          instanceId: input.instanceId,
          actorId: input.actorId,
          actionType: input.actionType,
          comment: input.comment
        }
      });
    });

    return this.findInstanceById(input.instanceId, input.tenantId);
  }
}
