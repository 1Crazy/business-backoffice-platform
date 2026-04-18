/** workflow 模块控制器：负责声明流程模板和运行时实例的后端接口。 */
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WorkflowTemplateStatus } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { AddSignWorkflowTaskDto } from "./dto/add-sign-workflow-task.dto";
import { CreateWorkflowCcDto } from "./dto/create-workflow-cc.dto";
import { CreateWorkflowTemplateDto } from "./dto/create-workflow-template.dto";
import { StartWorkflowInstanceDto } from "./dto/start-workflow-instance.dto";
import { TransferWorkflowTaskDto } from "./dto/transfer-workflow-task.dto";
import { UpdateWorkflowInstanceDto } from "./dto/update-workflow-instance.dto";
import { UpdateWorkflowTemplateDto } from "./dto/update-workflow-template.dto";
import { WorkflowTaskActionDto } from "./dto/workflow-task-action.dto";
import { WorkflowService } from "./workflow.service";
import { WorkflowInstanceVo, WorkflowPendingTaskVo, WorkflowTemplateVo } from "./vo/workflow.vo";

@ApiTags("workflows")
@ApiBearerAuth()
@Controller("workflows")
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get("templates")
  @Permissions("oa:workflow-template:read")
  @ApiOperation({
    summary: "查询流程模板列表",
    description: "查询全部流程模板列表。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo,
    isArray: true
  })
  listTemplates(@CurrentUser() user: AuthUser) {
    return this.workflowService.listTemplates(user);
  }

  @Get("templates/active")
  @Permissions("oa:workflow:read")
  @ApiOperation({
    summary: "查询可发起的流程模板",
    description: "查询当前已启用的流程模板。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo,
    isArray: true
  })
  listActiveTemplates(@CurrentUser() user: AuthUser) {
    return this.workflowService.listTemplates(user, WorkflowTemplateStatus.ACTIVE);
  }

  @Post("templates/key/:key/start")
  @Permissions("oa:workflow:apply")
  @ApiOperation({
    summary: "按模板 key 发起流程实例",
    description: "按流程模板 key 发起运行中的流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  startInstanceByTemplateKey(
    @Param("key") key: string,
    @Body() dto: StartWorkflowInstanceDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.workflowService.startInstanceByTemplateKey(key, dto, user);
  }

  @Get("templates/:id")
  @Permissions("oa:workflow-template:read")
  @ApiOperation({
    summary: "查询流程模板详情",
    description: "查询单个流程模板详情。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo
  })
  getTemplate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.workflowService.getTemplate(id, user);
  }

  @Post("templates")
  @Permissions("oa:workflow-template:write")
  @ApiOperation({
    summary: "创建流程模板",
    description: "创建流程模板并保存节点定义。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo
  })
  createTemplate(@Body() dto: CreateWorkflowTemplateDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.createTemplate(dto, user);
  }

  @Patch("templates/:id")
  @Permissions("oa:workflow-template:write")
  @ApiOperation({
    summary: "更新流程模板",
    description: "更新草稿或停用状态的流程模板。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo
  })
  updateTemplate(@Param("id") id: string, @Body() dto: UpdateWorkflowTemplateDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.updateTemplate(id, dto, user);
  }

  @Patch("templates/:id/activate")
  @Permissions("oa:workflow-template:write")
  @ApiOperation({
    summary: "启用流程模板",
    description: "启用流程模板，使其可用于发起流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo
  })
  activateTemplate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.workflowService.activateTemplate(id, user);
  }

  @Patch("templates/:id/disable")
  @Permissions("oa:workflow-template:write")
  @ApiOperation({
    summary: "停用流程模板",
    description: "停用流程模板，但不影响已发起的流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowTemplateVo
  })
  disableTemplate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.workflowService.disableTemplate(id, user);
  }

  @Post("templates/:id/start")
  @Permissions("oa:workflow:apply")
  @ApiOperation({
    summary: "发起流程实例",
    description: "按模板定义创建运行中的流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  startInstance(@Param("id") id: string, @Body() dto: StartWorkflowInstanceDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.startInstance(id, dto, user);
  }

  @Get("instances/mine")
  @Permissions("oa:workflow:apply")
  @ApiOperation({
    summary: "查询我发起的流程实例",
    description: "查询当前账号发起的流程实例列表。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo,
    isArray: true
  })
  listMyInstances(@CurrentUser() user: AuthUser) {
    return this.workflowService.listMyInstances(user);
  }

  @Get("instances/:id")
  @Permissions("oa:workflow:read")
  @ApiOperation({
    summary: "查询流程实例详情",
    description: "查询流程实例详情、任务轨迹和抄送信息。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  getInstance(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.workflowService.getInstance(id, user);
  }

  @Get("tasks/pending")
  @Permissions("oa:workflow:read")
  @ApiOperation({
    summary: "查询待我处理的流程任务",
    description: "查询当前账号待处理的流程任务列表。"
  })
  @ApiOkResponse({
    type: WorkflowPendingTaskVo,
    isArray: true
  })
  listPendingTasks(@CurrentUser() user: AuthUser) {
    return this.workflowService.listPendingTasks(user);
  }

  @Post("tasks/:taskId/approve")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "通过流程任务",
    description: "提交节点通过动作，并按模板推进流程。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  approveTask(@Param("taskId") taskId: string, @Body() dto: WorkflowTaskActionDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.approveTask(taskId, dto, user);
  }

  @Post("tasks/:taskId/reject")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "驳回流程任务",
    description: "驳回当前节点，并结束流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  rejectTask(@Param("taskId") taskId: string, @Body() dto: WorkflowTaskActionDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.rejectTask(taskId, dto, user);
  }

  @Post("tasks/:taskId/transfer")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "转交流程任务",
    description: "把当前待办转交给其他处理人。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  transferTask(@Param("taskId") taskId: string, @Body() dto: TransferWorkflowTaskDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.transferTask(taskId, dto, user);
  }

  @Post("tasks/:taskId/add-sign")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "为流程任务加签",
    description: "在当前节点追加新的审批人。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  addSignTask(@Param("taskId") taskId: string, @Body() dto: AddSignWorkflowTaskDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.addSignTask(taskId, dto, user);
  }

  @Post("instances/:id/cc")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "追加流程抄送",
    description: "为流程实例追加新的抄送对象。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  addCcRecipients(@Param("id") id: string, @Body() dto: CreateWorkflowCcDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.addCcRecipients(id, dto, user);
  }

  @Post("instances/:id/cancel")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "撤回流程实例",
    description: "由申请人撤回正在执行的流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  cancelInstance(@Param("id") id: string, @Body() dto: UpdateWorkflowInstanceDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.cancelInstance(id, dto, user);
  }

  @Post("instances/:id/terminate")
  @Permissions("oa:workflow:write")
  @ApiOperation({
    summary: "终止流程实例",
    description: "由流程管理员终止正在执行的流程实例。"
  })
  @ApiOkResponse({
    type: WorkflowInstanceVo
  })
  terminateInstance(@Param("id") id: string, @Body() dto: UpdateWorkflowInstanceDto, @CurrentUser() user: AuthUser) {
    return this.workflowService.terminateInstance(id, dto, user);
  }
}
