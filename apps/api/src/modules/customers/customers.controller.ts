/** customers 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { FollowUpVo } from "@/common/vo/entity.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateCustomerFollowUpDto } from "./dto/create-customer-follow-up.dto";
import { CreateCustomerTagDto } from "./dto/create-customer-tag.dto";
import { PaginatedCustomersResponseDto } from "./dto/list-customers-response.dto";
import { CUSTOMER_SORT_FIELDS, ListCustomersDto } from "./dto/list-customers.dto";
import { ReassignCustomerOwnerDto } from "./dto/reassign-customer-owner.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { UpdateCustomerTagsDto } from "./dto/update-customer-tags.dto";
import { CustomersService } from "./customers.service";
import { CustomerTagVo, CustomerVo } from "./vo/customer.vo";

@ApiTags("customers")
@ApiBearerAuth()
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions("customer:read")
  @ApiOperation({
    summary: "分页查询客户列表",
    description: "分页查询客户列表。"
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: CUSTOMER_SORT_FIELDS,
    description: "允许的排序字段。"
  })
  @ApiOkResponse({
    type: PaginatedCustomersResponseDto
  })
  list(@Query() query: ListCustomersDto, @CurrentUser() user: AuthUser) {
    return this.customersService.list(query, user);
  }

  @Get("tags")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询客户标签列表",
    description: "查询客户标签列表。"
  })
  @ApiOkResponse({
    type: CustomerTagVo,
    isArray: true
  })
  listTags() {
    return this.customersService.listTags();
  }

  @Post("tags")
  @Permissions("customer:write")
  @ApiOperation({
    summary: "创建客户标签",
    description: "创建客户标签。"
  })
  @ApiOkResponse({
    type: CustomerTagVo
  })
  createTag(@Body() dto: CreateCustomerTagDto, @CurrentUser() user: AuthUser) {
    return this.customersService.createTag(dto, user);
  }

  @Get(":id")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询客户详情",
    description: "查询客户详情。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.customersService.detail(id, user);
  }

  @Post()
  @Permissions("customer:write")
  @ApiOperation({
    summary: "创建客户",
    description: "创建客户。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("customer:write")
  @ApiOperation({
    summary: "更新客户",
    description: "更新客户。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.update(id, dto, user);
  }

  @Patch(":id/tags")
  @Permissions("customer:write")
  @ApiOperation({
    summary: "更新客户标签",
    description: "更新客户标签。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  updateTags(@Param("id") id: string, @Body() dto: UpdateCustomerTagsDto, @CurrentUser() user: AuthUser) {
    return this.customersService.updateTags(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("customer:assign")
  @ApiOperation({
    summary: "转移客户负责人",
    description: "转移客户负责人。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  reassignOwner(
    @Param("id") id: string,
    @Body() dto: ReassignCustomerOwnerDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.customersService.reassignOwner(id, dto, user);
  }

  @Get(":id/follow-ups")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询客户跟进记录",
    description: "查询客户跟进记录。"
  })
  @ApiOkResponse({
    type: FollowUpVo,
    isArray: true
  })
  listFollowUps(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.customersService.listFollowUps(id, user);
  }

  @Post(":id/follow-ups")
  @Permissions("followup:write")
  @ApiOperation({
    summary: "新增客户跟进记录",
    description: "新增客户跟进记录。"
  })
  @ApiOkResponse({
    type: FollowUpVo
  })
  createFollowUp(
    @Param("id") id: string,
    @Body() dto: CreateCustomerFollowUpDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.customersService.createFollowUp(id, dto, user);
  }
}
