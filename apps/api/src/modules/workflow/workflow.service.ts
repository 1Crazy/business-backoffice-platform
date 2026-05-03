/** workflow 模块 service：负责流程模板校验、实例推进和关键动作编排。 */
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import {
  AuditActionType,
  Prisma,
  WorkflowActionType,
  WorkflowAssignmentType,
  WorkflowInstanceStatus,
  WorkflowTaskStatus,
  WorkflowTemplateStatus
} from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { OpenIntegrationService } from "../open-integration/open-integration.service";
import { mapWorkflowInstance, mapWorkflowPendingTask, mapWorkflowTemplate } from "./mappers/workflow.mapper";
import { AddSignWorkflowTaskDto } from "./dto/add-sign-workflow-task.dto";
import { CreateWorkflowCcDto } from "./dto/create-workflow-cc.dto";
import {
  CreateWorkflowTemplateDto,
  type WorkflowBranchRuleDto,
  type WorkflowTemplateNodeDto
} from "./dto/create-workflow-template.dto";
import { StartWorkflowInstanceDto } from "./dto/start-workflow-instance.dto";
import { TransferWorkflowTaskDto } from "./dto/transfer-workflow-task.dto";
import { UpdateWorkflowInstanceDto } from "./dto/update-workflow-instance.dto";
import { UpdateWorkflowTemplateDto } from "./dto/update-workflow-template.dto";
import { WorkflowTaskActionDto } from "./dto/workflow-task-action.dto";
import {
  WorkflowInstanceRecord,
  WorkflowRepository,
  WorkflowTaskRecord,
  WorkflowTemplateRecord
} from "./repositories/workflow.repository";

type WorkflowBranchRule = {
  field: string;
  operator: WorkflowBranchRuleDto["operator"];
  value: unknown;
  nextNodeKey: string;
};

@Injectable()
export class WorkflowService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly openIntegrationService: OpenIntegrationService
  ) {}

  async listTemplates(actor: AuthUser, status?: WorkflowTemplateStatus) {
    const templates = await this.workflowRepository.listTemplates(requireTenantId(actor), status);
    return templates.map((item) => mapWorkflowTemplate(item));
  }

  async getTemplate(id: string, actor: AuthUser) {
    const template = await this.workflowRepository.findTemplateById(id, requireTenantId(actor));
    return mapWorkflowTemplate(template);
  }

  async listMyInstances(actor: AuthUser) {
    const instances = await this.workflowRepository.listInstancesByApplicant(actor.id, requireTenantId(actor));
    return instances.map((item) => mapWorkflowInstance(item));
  }

  async listPendingTasks(actor: AuthUser) {
    const tasks = await this.workflowRepository.listPendingTasks(actor.id, requireTenantId(actor));
    return tasks.map((item) => mapWorkflowPendingTask(item));
  }

  async createTemplate(dto: CreateWorkflowTemplateDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    this.validateTemplateDefinition(dto);

    const template = await this.workflowRepository.createTemplate({
      tenantId,
      key: dto.key.trim(),
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      businessType: dto.businessType.trim(),
      formSchema: toInputJsonValue(dto.formSchema),
      defaultCcUserIds: dto.defaultCcUserIds?.length ? dto.defaultCcUserIds : undefined,
      status: dto.status ?? WorkflowTemplateStatus.DRAFT,
      createdById: actor.id,
      updatedById: actor.id,
      nodes: dto.nodes
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((node) => this.normalizeTemplateNode(node))
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "workflow-template",
      targetId: template.id,
      detail: {
        key: template.key,
        status: template.status
      }
    });

    return mapWorkflowTemplate(template);
  }

  async updateTemplate(id: string, dto: UpdateWorkflowTemplateDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    this.validateTemplateDefinition(dto);

    const current = await this.workflowRepository.findTemplateById(id, tenantId);
    this.assertTemplateEditable(current);

    const template = await this.workflowRepository.updateTemplate(id, tenantId, {
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      businessType: dto.businessType.trim(),
      formSchema: toInputJsonValue(dto.formSchema),
      defaultCcUserIds: dto.defaultCcUserIds?.length ? dto.defaultCcUserIds : undefined,
      updatedById: actor.id,
      nodes: dto.nodes
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((node) => this.normalizeTemplateNode(node))
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "workflow-template",
      targetId: template.id,
      detail: {
        key: template.key,
        status: template.status
      }
    });

    return mapWorkflowTemplate(template);
  }

  async activateTemplate(id: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const template = await this.workflowRepository.findTemplateById(id, tenantId);

    if (template.status === WorkflowTemplateStatus.ACTIVE) {
      return mapWorkflowTemplate(template);
    }

    this.validateStoredTemplate(template);

    const activated = await this.workflowRepository.updateTemplateStatus(
      id,
      tenantId,
      WorkflowTemplateStatus.ACTIVE,
      actor.id
    );

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ENABLE,
      targetType: "workflow-template",
      targetId: activated.id
    });

    return mapWorkflowTemplate(activated);
  }

  async disableTemplate(id: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const template = await this.workflowRepository.updateTemplateStatus(
      id,
      tenantId,
      WorkflowTemplateStatus.DISABLED,
      actor.id
    );

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.DISABLE,
      targetType: "workflow-template",
      targetId: template.id
    });

    return mapWorkflowTemplate(template);
  }

  async startInstance(templateId: string, dto: StartWorkflowInstanceDto, actor: AuthUser) {
    const template = await this.workflowRepository.findTemplateById(templateId, requireTenantId(actor));

    return this.startInstanceFromTemplate(template, dto, actor);
  }

  async startInstanceByTemplateKey(templateKey: string, dto: StartWorkflowInstanceDto, actor: AuthUser) {
    const template = await this.workflowRepository.findTemplateByKey(templateKey, requireTenantId(actor));

    return this.startInstanceFromTemplate(template, dto, actor);
  }

  private async startInstanceFromTemplate(
    template: WorkflowTemplateRecord,
    dto: StartWorkflowInstanceDto,
    actor: AuthUser
  ) {
    const tenantId = requireTenantId(actor);

    if (template.status !== WorkflowTemplateStatus.ACTIVE) {
      throw new BadRequestException("只有已启用的流程模板可以发起。");
    }

    if (!template.nodes.length) {
      throw new BadRequestException("当前模板还没有可执行的审批节点。");
    }

    const firstNode = template.nodes[0];
    const assigneeIds = await this.resolveAssigneeIds(firstNode, actor.id, tenantId);
    const ccRecipients = this.mergeCcRecipients([
      ...this.buildCcRecipients(readStringArray(template.defaultCcUserIds), actor.id, null),
      ...this.buildCcRecipients(readStringArray(firstNode.ccUserIds), actor.id, firstNode.nodeKey),
      ...this.buildCcRecipients(dto.ccUserIds ?? [], actor.id, firstNode.nodeKey)
    ]);

    const instance = await this.workflowRepository.createWorkflowInstance({
      tenantId,
      templateId: template.id,
      applicantId: actor.id,
      businessKey: dto.businessKey?.trim() || undefined,
      title: dto.title.trim(),
      formData: toInputJsonValue(dto.formData),
      currentNodeKey: firstNode.nodeKey,
      initialNodeId: firstNode.id,
      initialNodeName: firstNode.name,
      assigneeIds,
      ccRecipients
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "workflow-instance",
      targetId: instance.id,
      detail: {
        templateKey: template.key,
        currentNodeKey: firstNode.nodeKey
      }
    });

    return mapWorkflowInstance(instance);
  }

  async getInstance(id: string, actor: AuthUser) {
    const instance = await this.workflowRepository.findInstanceById(id, requireTenantId(actor));
    this.assertInstanceReadable(instance, actor);
    return mapWorkflowInstance(instance);
  }

  async approveTask(taskId: string, dto: WorkflowTaskActionDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const task = await this.workflowRepository.findTaskById(taskId, tenantId);
    this.assertTaskActionable(task, actor);

    if (task.status !== WorkflowTaskStatus.PENDING) {
      throw new BadRequestException("当前任务已处理，不能重复提交通过动作。");
    }

    if (task.instance.status !== WorkflowInstanceStatus.IN_PROGRESS) {
      throw new BadRequestException("当前流程实例已经结束，不能继续处理。");
    }

    if (!task.templateNode) {
      throw new BadRequestException("当前任务缺少节点定义，无法继续推进。");
    }

    const siblingPendingTasks = task.instance.tasks.filter(
      (item) => item.id !== task.id && item.nodeKey === task.nodeKey && item.status === WorkflowTaskStatus.PENDING
    );

    const nextNode =
      siblingPendingTasks.length === 0
        ? this.resolveNextNode(task.instance.template, task.templateNode, readRecordObject(task.instance.formData))
        : null;

    const instance = await this.workflowRepository.approveTask({
      tenantId,
      instanceId: task.instance.id,
      taskId: task.id,
      actorId: actor.id,
      comment: dto.comment?.trim() || undefined,
      nextNode: nextNode
        ? {
            id: nextNode.id,
            nodeKey: nextNode.nodeKey,
            nodeName: nextNode.name,
            assigneeIds: await this.resolveAssigneeIds(nextNode, task.instance.applicant.id, tenantId)
          }
        : null,
      nextNodeCcRecipients: nextNode
        ? this.buildCcRecipients(readStringArray(nextNode.ccUserIds), actor.id, nextNode.nodeKey)
        : [],
      completeInstance: siblingPendingTasks.length === 0 && !nextNode
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "workflow-instance",
      targetId: task.instance.id,
      detail: {
        taskId: task.id,
        decision: "APPROVED"
      }
    });

    if (
      (instance.status === WorkflowInstanceStatus.APPROVED || instance.status === WorkflowInstanceStatus.REJECTED) &&
      !instance.currentNodeKey
    ) {
      await this.openIntegrationService.dispatchBusinessWebhookEvent({
        tenantId,
        eventType: "WORKFLOW_INSTANCE_COMPLETED",
        sourceType: "workflow-instance",
        sourceId: instance.id,
        payload: {
          instanceId: instance.id,
          templateId: instance.template.id,
          templateKey: instance.template.key,
          title: instance.title,
          status: instance.status
        },
        actorId: actor.id,
        actorName: actor.displayName,
        occurredAt: instance.completedAt ?? new Date()
      });
    }

    return mapWorkflowInstance(instance);
  }

  async rejectTask(taskId: string, dto: WorkflowTaskActionDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const task = await this.workflowRepository.findTaskById(taskId, tenantId);
    this.assertTaskActionable(task, actor);

    if (task.status !== WorkflowTaskStatus.PENDING) {
      throw new BadRequestException("当前任务已处理，不能重复提交驳回动作。");
    }

    if (task.instance.status !== WorkflowInstanceStatus.IN_PROGRESS) {
      throw new BadRequestException("当前流程实例已经结束，不能继续处理。");
    }

    const cancelTaskIds = task.instance.tasks
      .filter((item) => item.id !== task.id && item.status === WorkflowTaskStatus.PENDING)
      .map((item) => item.id);
    const instance = await this.workflowRepository.rejectTask({
      tenantId,
      instanceId: task.instance.id,
      taskId: task.id,
      actorId: actor.id,
      comment: dto.comment?.trim() || undefined,
      cancelTaskIds
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "workflow-instance",
      targetId: task.instance.id,
      detail: {
        taskId: task.id,
        decision: "REJECTED"
      }
    });

    if (
      (instance.status === WorkflowInstanceStatus.APPROVED || instance.status === WorkflowInstanceStatus.REJECTED) &&
      !instance.currentNodeKey
    ) {
      await this.openIntegrationService.dispatchBusinessWebhookEvent({
        tenantId,
        eventType: "WORKFLOW_INSTANCE_COMPLETED",
        sourceType: "workflow-instance",
        sourceId: instance.id,
        payload: {
          instanceId: instance.id,
          templateId: instance.template.id,
          templateKey: instance.template.key,
          title: instance.title,
          status: instance.status
        },
        actorId: actor.id,
        actorName: actor.displayName,
        occurredAt: instance.completedAt ?? new Date()
      });
    }

    return mapWorkflowInstance(instance);
  }

  async transferTask(taskId: string, dto: TransferWorkflowTaskDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const task = await this.workflowRepository.findTaskById(taskId, tenantId);
    this.assertTaskActionable(task, actor);

    if (task.status !== WorkflowTaskStatus.PENDING) {
      throw new BadRequestException("只有待处理任务可以转交。");
    }

    if (!task.templateNode?.allowTransfer) {
      throw new BadRequestException("当前节点未开启转交能力。");
    }

    await this.assertUsersExist([dto.assigneeId], tenantId);

    const instance = await this.workflowRepository.transferTask({
      tenantId,
      instanceId: task.instance.id,
      taskId: task.id,
      actorId: actor.id,
      assigneeId: dto.assigneeId,
      comment: dto.comment?.trim() || undefined,
      templateNodeId: task.templateNode?.id,
      nodeKey: task.nodeKey,
      nodeName: task.nodeName
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ASSIGN,
      targetType: "workflow-task",
      targetId: task.id,
      detail: {
        assigneeId: dto.assigneeId
      }
    });

    return mapWorkflowInstance(instance);
  }

  async addSignTask(taskId: string, dto: AddSignWorkflowTaskDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const task = await this.workflowRepository.findTaskById(taskId, tenantId);
    this.assertTaskActionable(task, actor);

    if (task.status !== WorkflowTaskStatus.PENDING) {
      throw new BadRequestException("只有待处理任务可以加签。");
    }

    if (!task.templateNode?.allowAddSign) {
      throw new BadRequestException("当前节点未开启加签能力。");
    }

    await this.assertUsersExist([dto.assigneeId], tenantId);

    const instance = await this.workflowRepository.addSignTask({
      tenantId,
      instanceId: task.instance.id,
      taskId: task.id,
      actorId: actor.id,
      assigneeId: dto.assigneeId,
      comment: dto.comment?.trim() || undefined,
      templateNodeId: task.templateNode?.id,
      nodeKey: task.nodeKey,
      nodeName: task.nodeName
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ASSIGN,
      targetType: "workflow-task",
      targetId: task.id,
      detail: {
        mode: "ADD_SIGN",
        assigneeId: dto.assigneeId
      }
    });

    return mapWorkflowInstance(instance);
  }

  async addCcRecipients(instanceId: string, dto: CreateWorkflowCcDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const instance = await this.workflowRepository.findInstanceById(instanceId, tenantId);
    this.assertCcManageable(instance, actor);
    await this.assertUsersExist(dto.userIds, tenantId);

    const next = await this.workflowRepository.addCcRecipients({
      tenantId,
      instanceId,
      actorId: actor.id,
      comment: dto.comment?.trim() || undefined,
      recipients: this.mergeCcRecipients(
        this.buildCcRecipients(dto.userIds, actor.id, instance.currentNodeKey ?? null)
      ).map((item) => ({
        userId: item.userId,
        sourceNodeKey: item.sourceNodeKey
      }))
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.ASSIGN,
      targetType: "workflow-instance",
      targetId: instanceId,
      detail: {
        mode: "CC",
        userIds: dto.userIds
      }
    });

    return mapWorkflowInstance(next);
  }

  async cancelInstance(instanceId: string, dto: UpdateWorkflowInstanceDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const instance = await this.workflowRepository.findInstanceById(instanceId, tenantId);

    if (!actor.roleCodes.includes("super-admin") && instance.applicant.id !== actor.id) {
      throw new ForbiddenException("只有申请人可以撤回当前流程。");
    }

    if (instance.status !== WorkflowInstanceStatus.IN_PROGRESS) {
      throw new BadRequestException("只有进行中的流程可以撤回。");
    }

    const next = await this.workflowRepository.closeInstance({
      tenantId,
      instanceId,
      actorId: actor.id,
      actionType: WorkflowActionType.CANCELLED,
      status: WorkflowInstanceStatus.CANCELLED,
      comment: dto.comment?.trim() || undefined,
      cancelTaskIds: instance.tasks.filter((item) => item.status === WorkflowTaskStatus.PENDING).map((item) => item.id)
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "workflow-instance",
      targetId: instanceId,
      detail: {
        decision: "CANCELLED"
      }
    });

    return mapWorkflowInstance(next);
  }

  async terminateInstance(instanceId: string, dto: UpdateWorkflowInstanceDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const instance = await this.workflowRepository.findInstanceById(instanceId, tenantId);

    if (!this.isWorkflowAdmin(actor) && !actor.roleCodes.includes("super-admin")) {
      throw new ForbiddenException("当前账号不能终止该流程。");
    }

    if (instance.status !== WorkflowInstanceStatus.IN_PROGRESS) {
      throw new BadRequestException("只有进行中的流程可以终止。");
    }

    const next = await this.workflowRepository.closeInstance({
      tenantId,
      instanceId,
      actorId: actor.id,
      actionType: WorkflowActionType.TERMINATED,
      status: WorkflowInstanceStatus.TERMINATED,
      comment: dto.comment?.trim() || undefined,
      cancelTaskIds: instance.tasks.filter((item) => item.status === WorkflowTaskStatus.PENDING).map((item) => item.id)
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "workflow-instance",
      targetId: instanceId,
      detail: {
        decision: "TERMINATED"
      }
    });

    return mapWorkflowInstance(next);
  }

  private assertTemplateEditable(template: WorkflowTemplateRecord): void {
    if (template.status === WorkflowTemplateStatus.ACTIVE) {
      throw new BadRequestException("已启用模板不能直接修改，请先停用后再调整。");
    }
  }

  private validateStoredTemplate(template: WorkflowTemplateRecord): void {
    this.validateTemplateDefinition({
      key: template.key,
      name: template.name,
      businessType: template.businessType,
      formSchema: readRecordObject(template.formSchema),
      nodes: template.nodes.map((node) => ({
        nodeKey: node.nodeKey,
        name: node.name,
        nodeType: node.nodeType,
        position: node.position,
        assignmentType: node.assignmentType,
        assignmentConfig: readRecordObject(node.assignmentConfig),
        branchRules: this.readBranchRules(node.branchRules),
        fallbackNodeKey: node.fallbackNodeKey ?? undefined,
        allowAddSign: node.allowAddSign,
        allowTransfer: node.allowTransfer,
        ccUserIds: readStringArray(node.ccUserIds)
      }))
    });
  }

  private validateTemplateDefinition(dto: Pick<CreateWorkflowTemplateDto, "nodes" | "formSchema"> & {
    key?: string;
    name?: string;
    businessType?: string;
  }): void {
    if (!dto.nodes.length) {
      throw new BadRequestException("流程模板至少需要一个审批节点。");
    }

    if (!dto.formSchema || typeof dto.formSchema !== "object" || Array.isArray(dto.formSchema)) {
      throw new BadRequestException("表单结构定义不能为空。");
    }

    const nodeKeys = new Set<string>();
    const positions = new Set<number>();

    dto.nodes.forEach((node) => {
      if (nodeKeys.has(node.nodeKey)) {
        throw new BadRequestException(`节点 key ${node.nodeKey} 重复，请调整后重试。`);
      }

      if (positions.has(node.position)) {
        throw new BadRequestException(`节点顺序 ${node.position} 重复，请调整后重试。`);
      }

      nodeKeys.add(node.nodeKey);
      positions.add(node.position);
      this.assertAssignmentConfig(node);
    });

    dto.nodes.forEach((node) => {
      this.readBranchRules(node.branchRules).forEach((rule) => {
        if (!nodeKeys.has(rule.nextNodeKey)) {
          throw new BadRequestException(`节点 ${node.nodeKey} 的分支目标 ${rule.nextNodeKey} 不存在。`);
        }
      });

      if (node.fallbackNodeKey && !nodeKeys.has(node.fallbackNodeKey)) {
        throw new BadRequestException(`节点 ${node.nodeKey} 的兜底节点 ${node.fallbackNodeKey} 不存在。`);
      }
    });
  }

  private assertAssignmentConfig(node: Pick<WorkflowTemplateNodeDto, "assignmentType" | "assignmentConfig" | "nodeKey">) {
    const config = readRecordObject(node.assignmentConfig);

    if (node.assignmentType === WorkflowAssignmentType.USER) {
      if (!readStringArray(config.userIds).length) {
        throw new BadRequestException(`节点 ${node.nodeKey} 需要配置至少一个指定审批人。`);
      }

      return;
    }

    if (node.assignmentType === WorkflowAssignmentType.PERMISSION) {
      if (!readRecordString(config.permissionCode)) {
        throw new BadRequestException(`节点 ${node.nodeKey} 需要配置 permissionCode。`);
      }
    }
  }

  private normalizeTemplateNode(node: WorkflowTemplateNodeDto) {
    return {
      nodeKey: node.nodeKey.trim(),
      name: node.name.trim(),
      nodeType: node.nodeType ?? "APPROVAL",
      position: node.position,
      assignmentType: node.assignmentType,
      assignmentConfig: toInputJsonValue(node.assignmentConfig),
      branchRules: node.branchRules?.length ? toInputJsonValue(node.branchRules) : undefined,
      fallbackNodeKey: node.fallbackNodeKey?.trim() || undefined,
      allowAddSign: node.allowAddSign ?? true,
      allowTransfer: node.allowTransfer ?? true,
      ccUserIds: node.ccUserIds?.length ? toInputJsonValue(node.ccUserIds) : undefined
    };
  }

  private async resolveAssigneeIds(
    node: Pick<WorkflowTemplateRecord["nodes"][number], "assignmentType" | "assignmentConfig" | "nodeKey">,
    applicantId: string,
    tenantId: string
  ) {
    if (node.assignmentType === WorkflowAssignmentType.INITIATOR) {
      return [applicantId];
    }

    const config = readRecordObject(node.assignmentConfig);

    if (node.assignmentType === WorkflowAssignmentType.USER) {
      const userIds = Array.from(new Set(readStringArray(config.userIds)));
      await this.assertUsersExist(userIds, tenantId);
      return userIds;
    }

    const permissionCode = readRecordString(config.permissionCode);

    if (!permissionCode) {
      throw new BadRequestException(`节点 ${node.nodeKey} 未配置有效的 permissionCode。`);
    }

    const users = await this.workflowRepository.listUsersByPermission(permissionCode, tenantId);

    if (!users.length) {
      throw new BadRequestException(`节点 ${node.nodeKey} 没有匹配到具备 ${permissionCode} 的审批人。`);
    }

    return users.map((item) => item.id);
  }

  private resolveNextNode(
    template: WorkflowInstanceRecord["template"],
    currentNode: WorkflowTaskRecord["templateNode"],
    formData: Record<string, unknown>
  ) {
    if (!currentNode) {
      return null;
    }

    const branchRules = this.readBranchRules(currentNode.branchRules);

    for (const rule of branchRules) {
      if (this.matchesBranchRule(formData[rule.field], rule)) {
        return template.nodes.find((node) => node.nodeKey === rule.nextNodeKey) ?? null;
      }
    }

    if (currentNode.fallbackNodeKey) {
      return template.nodes.find((node) => node.nodeKey === currentNode.fallbackNodeKey) ?? null;
    }

    return (
      template.nodes
        .slice()
        .sort((left, right) => left.position - right.position)
        .find((node) => node.position > currentNode.position) ?? null
    );
  }

  private readBranchRules(value: unknown): WorkflowBranchRule[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return null;
        }

        const record = item as Record<string, unknown>;

        if (!readRecordString(record.field) || !readRecordString(record.nextNodeKey)) {
          return null;
        }

        const operator = readRecordString(record.operator) as WorkflowBranchRule["operator"];

        if (!["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN"].includes(operator)) {
          return null;
        }

        return {
          field: record.field as string,
          operator,
          value: record.value,
          nextNodeKey: record.nextNodeKey as string
        };
      })
      .filter(Boolean) as WorkflowBranchRule[];
  }

  private matchesBranchRule(actualValue: unknown, rule: WorkflowBranchRule): boolean {
    switch (rule.operator) {
      case "EQ":
        return actualValue === rule.value;
      case "NEQ":
        return actualValue !== rule.value;
      case "GT":
        return this.toComparableNumber(actualValue) > this.toComparableNumber(rule.value);
      case "GTE":
        return this.toComparableNumber(actualValue) >= this.toComparableNumber(rule.value);
      case "LT":
        return this.toComparableNumber(actualValue) < this.toComparableNumber(rule.value);
      case "LTE":
        return this.toComparableNumber(actualValue) <= this.toComparableNumber(rule.value);
      case "IN":
        return Array.isArray(rule.value) && rule.value.includes(actualValue);
      default:
        return false;
    }
  }

  private toComparableNumber(value: unknown): number {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      return Number(value);
    }

    return Number.NaN;
  }

  private assertTaskActionable(task: WorkflowTaskRecord, actor: AuthUser): void {
    const isSuperAdmin = actor.roleCodes.includes("super-admin");

    if (!isSuperAdmin && task.assignee.id !== actor.id) {
      throw new ForbiddenException("当前账号不能处理这条流程任务。");
    }
  }

  private assertInstanceReadable(instance: WorkflowInstanceRecord, actor: AuthUser): void {
    const isSuperAdmin = actor.roleCodes.includes("super-admin");
    const hasReadPermission = actor.permissions.includes("oa:workflow:read");
    const isApplicant = instance.applicant.id === actor.id;
    const isAssignee = instance.tasks.some((item) => item.assignee.id === actor.id);
    const isCcRecipient = instance.ccRecipients.some((item) => item.user.id === actor.id);

    if (!isSuperAdmin && !hasReadPermission && !isApplicant && !isAssignee && !isCcRecipient) {
      throw new ForbiddenException("当前账号不能查看该流程实例。");
    }
  }

  private assertCcManageable(instance: WorkflowInstanceRecord, actor: AuthUser): void {
    const isSuperAdmin = actor.roleCodes.includes("super-admin");
    const isApplicant = instance.applicant.id === actor.id;
    const isPendingAssignee = instance.tasks.some(
      (item) => item.assignee.id === actor.id && item.status === WorkflowTaskStatus.PENDING
    );

    if (!isSuperAdmin && !isApplicant && !isPendingAssignee && !this.isWorkflowAdmin(actor)) {
      throw new ForbiddenException("当前账号不能为该流程追加抄送。");
    }
  }

  private isWorkflowAdmin(actor: AuthUser): boolean {
    return actor.permissions.includes("oa:workflow-template:write");
  }

  private async assertUsersExist(userIds: string[], tenantId: string) {
    const deduped = Array.from(new Set(userIds.filter(Boolean)));

    if (!deduped.length) {
      throw new BadRequestException("至少需要指定一个有效用户。");
    }

    const users = await this.workflowRepository.listUsersByIds(deduped, tenantId);

    if (users.length !== deduped.length) {
      throw new BadRequestException("存在无效或不可用的用户，无法继续执行流程动作。");
    }
  }

  private buildCcRecipients(userIds: string[], createdById: string, sourceNodeKey?: string | null) {
    return Array.from(new Set(userIds.filter(Boolean))).map((userId) => ({
      userId,
      createdById,
      sourceNodeKey: sourceNodeKey ?? null
    }));
  }

  private mergeCcRecipients<T extends { userId: string; sourceNodeKey?: string | null }>(items: T[]): T[] {
    return items.filter(
      (item, index, array) =>
        array.findIndex(
          (target) => target.userId === item.userId && (target.sourceNodeKey ?? null) === (item.sourceNodeKey ?? null)
        ) === index
    );
  }
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

function readRecordString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
