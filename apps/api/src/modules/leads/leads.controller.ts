import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadFollowUpDto } from "./dto/create-lead-follow-up.dto";
import { ListLeadRemindersDto, REMINDER_SORT_FIELDS } from "./dto/list-lead-reminders.dto";
import { PaginatedLeadRemindersResponseDto } from "./dto/list-lead-reminders-response.dto";
import { LEAD_SORT_FIELDS, ListLeadsDto } from "./dto/list-leads.dto";
import { PaginatedLeadsResponseDto } from "./dto/list-leads-response.dto";
import { ReassignLeadOwnerDto } from "./dto/reassign-lead-owner.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadsService } from "./leads.service";

@ApiTags("leads")
@ApiBearerAuth()
@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Permissions("lead:read")
  @ApiOperation({
    summary: "分页查询线索列表"
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
  list(@Query() query: ListLeadsDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.list(query, user);
  }

  @Get("reminders")
  @Permissions("lead:read")
  @ApiOperation({
    summary: "分页查询待办提醒"
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
  pendingReminders(@Query() query: ListLeadRemindersDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.pendingReminders(query, user);
  }

  @Get(":id")
  @Permissions("lead:read")
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.detail(id, user);
  }

  @Post()
  @Permissions("lead:write")
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("lead:write")
  update(@Param("id") id: string, @Body() dto: UpdateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.update(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("lead:assign")
  reassignOwner(@Param("id") id: string, @Body() dto: ReassignLeadOwnerDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.reassignOwner(id, dto, user);
  }

  @Post(":id/convert")
  @Permissions("lead:convert")
  convert(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.convert(id, user);
  }

  @Get(":id/follow-ups")
  @Permissions("lead:read")
  listFollowUps(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.listFollowUps(id, user);
  }

  @Post(":id/follow-ups")
  @Permissions("followup:write")
  createFollowUp(@Param("id") id: string, @Body() dto: CreateLeadFollowUpDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.createFollowUp(id, dto, user);
  }
}
