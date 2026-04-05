import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadFollowUpDto } from "./dto/create-lead-follow-up.dto";
import { ListLeadsDto } from "./dto/list-leads.dto";
import { ReassignLeadOwnerDto } from "./dto/reassign-lead-owner.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadsService } from "./leads.service";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Permissions("lead:read")
  list(@Query() query: ListLeadsDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.list(query, user);
  }

  @Get("reminders")
  @Permissions("lead:read")
  pendingReminders(@CurrentUser() user: AuthUser) {
    return this.leadsService.pendingReminders(user);
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

