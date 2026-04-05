import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateCustomerFollowUpDto } from "./dto/create-customer-follow-up.dto";
import { CreateCustomerTagDto } from "./dto/create-customer-tag.dto";
import { ListCustomersDto } from "./dto/list-customers.dto";
import { ReassignCustomerOwnerDto } from "./dto/reassign-customer-owner.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { UpdateCustomerTagsDto } from "./dto/update-customer-tags.dto";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions("customer:read")
  list(@Query() query: ListCustomersDto, @CurrentUser() user: AuthUser) {
    return this.customersService.list(query, user);
  }

  @Get("tags")
  @Permissions("customer:read")
  listTags() {
    return this.customersService.listTags();
  }

  @Post("tags")
  @Permissions("customer:write")
  createTag(@Body() dto: CreateCustomerTagDto, @CurrentUser() user: AuthUser) {
    return this.customersService.createTag(dto, user);
  }

  @Get(":id")
  @Permissions("customer:read")
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.customersService.detail(id, user);
  }

  @Post()
  @Permissions("customer:write")
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("customer:write")
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.update(id, dto, user);
  }

  @Patch(":id/tags")
  @Permissions("customer:write")
  updateTags(@Param("id") id: string, @Body() dto: UpdateCustomerTagsDto, @CurrentUser() user: AuthUser) {
    return this.customersService.updateTags(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("customer:assign")
  reassignOwner(
    @Param("id") id: string,
    @Body() dto: ReassignCustomerOwnerDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.customersService.reassignOwner(id, dto, user);
  }

  @Get(":id/follow-ups")
  @Permissions("customer:read")
  listFollowUps(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.customersService.listFollowUps(id, user);
  }

  @Post(":id/follow-ups")
  @Permissions("followup:write")
  createFollowUp(
    @Param("id") id: string,
    @Body() dto: CreateCustomerFollowUpDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.customersService.createFollowUp(id, dto, user);
  }
}

