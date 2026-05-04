/** leads 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { FollowUpVo } from "@/common/vo/entity.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { ActionPermission } from "@/common/decorators/action-permission.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { ApiCommonErrorResponses } from "@/common/swagger/common-error-responses.decorator";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadFollowUpDto } from "./dto/create-lead-follow-up.dto";
import { ListLeadRemindersDto, REMINDER_SORT_FIELDS } from "./dto/list-lead-reminders.dto";
import { PaginatedLeadRemindersResponseDto } from "./dto/list-lead-reminders-response.dto";
import { LEAD_SORT_FIELDS, ListLeadsDto } from "./dto/list-leads.dto";
import { PaginatedLeadsResponseDto } from "./dto/list-leads-response.dto";
import { ReassignLeadOwnerDto } from "./dto/reassign-lead-owner.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadsService } from "./leads.service";
import { LeadVo } from "./vo/lead.vo";

@ApiTags("leads")
@ApiBearerAuth()
@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Permissions("lead:read")
  @ApiOperation({
    summary: "分页查询线索列表",
    description: "按关键字、来源、状态和负责人筛选线索，并返回统一分页结构。"
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: LEAD_SORT_FIELDS,
    description: "允许的排序字段。"
  })
  @ApiOkResponse({
    type: PaginatedLeadsResponseDto
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索查询权限，或超出可访问数据范围。"
  })
  list(@Query() query: ListLeadsDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.list(query, user);
  }

  @Get("reminders")
  @Permissions("lead:read")
  @ApiOperation({
    summary: "分页查询待办提醒",
    description: "查询与线索或客户跟进相关的提醒待办，并返回统一分页结构。"
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: REMINDER_SORT_FIELDS,
    description: "允许的排序字段。"
  })
  @ApiOkResponse({
    type: PaginatedLeadRemindersResponseDto
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索查询权限，或超出提醒数据范围。"
  })
  pendingReminders(@Query() query: ListLeadRemindersDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.pendingReminders(query, user);
  }

  @Get(":id")
  @Permissions("lead:read")
  @ApiOperation({
    summary: "查询线索详情",
    description: "查询单个线索的基础资料、负责人、转化状态与附件等聚合信息。"
  })
  @ApiOkResponse({
    type: LeadVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索查询权限，或无权访问该线索。",
    notFound: "未找到指定线索。"
  })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.detail(id, user);
  }

  @Post()
  @Permissions("lead:write")
  @ApiOperation({
    summary: "创建线索",
    description: "创建新的销售线索，可同时指定负责人、来源与初始备注。"
  })
  @ApiOkResponse({
    type: LeadVo
  })
  @ApiCommonErrorResponses({
    badRequest: "线索名称、负责人或来源参数不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索写入权限，或无权指派目标负责人。"
  })
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("lead:write")
  @ApiOperation({
    summary: "更新线索",
    description: "更新线索基础资料、来源、备注或其他可编辑字段。"
  })
  @ApiOkResponse({
    type: LeadVo
  })
  @ApiCommonErrorResponses({
    badRequest: "线索更新参数不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索写入权限，或无权修改该线索。",
    notFound: "未找到指定线索。"
  })
  update(@Param("id") id: string, @Body() dto: UpdateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.update(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("lead:assign")
  @ActionPermission("lead", "assign")
  @ApiOperation({
    summary: "转移线索负责人",
    description: "将线索重新分配给新的负责人，并同步做动作权限与数据范围校验。"
  })
  @ApiOkResponse({
    type: LeadVo
  })
  @ApiCommonErrorResponses({
    badRequest: "负责人 ID 不合法，或目标负责人不满足分配要求。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索分配权限，或目标线索不在可操作范围内。",
    notFound: "未找到指定线索。"
  })
  reassignOwner(@Param("id") id: string, @Body() dto: ReassignLeadOwnerDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.reassignOwner(id, dto, user);
  }

  @Post(":id/convert")
  @Permissions("lead:convert")
  @ActionPermission("lead", "convert")
  @ApiOperation({
    summary: "将线索转为客户",
    description: "将线索正式转化为客户；转化后会在详情中保留已关联的客户摘要信息。"
  })
  @ApiOkResponse({
    type: LeadVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索转化权限，或目标线索不在可操作范围内。",
    notFound: "未找到指定线索。"
  })
  convert(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.convert(id, user);
  }

  @Get(":id/follow-ups")
  @Permissions("lead:read")
  @ApiOperation({
    summary: "查询线索跟进记录",
    description: "查询单个线索的跟进记录和关联提醒信息。"
  })
  @ApiOkResponse({
    type: FollowUpVo,
    isArray: true
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有线索查询权限，或无权查看该线索。",
    notFound: "未找到指定线索。"
  })
  listFollowUps(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.listFollowUps(id, user);
  }

  @Post(":id/follow-ups")
  @Permissions("followup:write")
  @ApiOperation({
    summary: "新增线索跟进记录",
    description: "为线索新增一条跟进记录；可选地创建下一次跟进提醒。"
  })
  @ApiOkResponse({
    type: FollowUpVo
  })
  @ApiCommonErrorResponses({
    badRequest: "跟进内容或下次跟进时间格式不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有跟进写入权限，或无权操作该线索。",
    notFound: "未找到指定线索。"
  })
  createFollowUp(@Param("id") id: string, @Body() dto: CreateLeadFollowUpDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.createFollowUp(id, dto, user);
  }
}
