/** customers 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { FollowUpVo } from "@/common/vo/entity.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { ActionPermission } from "@/common/decorators/action-permission.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { ApiCommonErrorResponses } from "@/common/swagger/common-error-responses.decorator";
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
    description: "按关键字、来源、状态、负责人和标签筛选客户列表，并返回统一分页结构。"
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
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户查询权限，或超出可访问数据范围。"
  })
  list(@Query() query: ListCustomersDto, @CurrentUser() user: AuthUser) {
    return this.customersService.list(query, user);
  }

  @Get("tags")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询客户标签列表",
    description: "查询当前租户下可用于客户打标的标签列表。"
  })
  @ApiOkResponse({
    type: CustomerTagVo,
    isArray: true
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户查询权限。"
  })
  listTags(@CurrentUser() user: AuthUser) {
    return this.customersService.listTags(user);
  }

  @Post("tags")
  @Permissions("customer:write")
  @ApiOperation({
    summary: "创建客户标签",
    description: "创建新的客户标签，供后续客户打标和筛选使用。"
  })
  @ApiOkResponse({
    type: CustomerTagVo
  })
  @ApiCommonErrorResponses({
    badRequest: "标签名称或颜色值不合法，或与现有标签规则冲突。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户写入权限。"
  })
  createTag(@Body() dto: CreateCustomerTagDto, @CurrentUser() user: AuthUser) {
    return this.customersService.createTag(dto, user);
  }

  @Get(":id")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询客户详情",
    description: "查询单个客户的基础资料、负责人、标签和附件等聚合信息。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户查询权限，或无权访问该客户。",
    notFound: "未找到指定客户。"
  })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.customersService.detail(id, user);
  }

  @Post()
  @Permissions("customer:write")
  @ApiOperation({
    summary: "创建客户",
    description: "创建新的客户记录，可同时指定负责人、来源、状态和初始标签。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  @ApiCommonErrorResponses({
    badRequest: "客户名称、邮箱、标签或负责人参数不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户写入权限，或无权指派目标负责人。"
  })
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("customer:write")
  @ApiOperation({
    summary: "更新客户",
    description: "更新客户基础资料、来源、状态、备注等可编辑字段。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  @ApiCommonErrorResponses({
    badRequest: "客户更新参数不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户写入权限，或无权修改该客户。",
    notFound: "未找到指定客户。"
  })
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.update(id, dto, user);
  }

  @Patch(":id/tags")
  @Permissions("customer:write")
  @ApiOperation({
    summary: "更新客户标签",
    description: "批量覆盖客户当前绑定的标签列表。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  @ApiCommonErrorResponses({
    badRequest: "标签 ID 列表不合法，或包含当前租户下不存在的标签。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户写入权限，或无权修改该客户。",
    notFound: "未找到指定客户。"
  })
  updateTags(@Param("id") id: string, @Body() dto: UpdateCustomerTagsDto, @CurrentUser() user: AuthUser) {
    return this.customersService.updateTags(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("customer:assign")
  @ActionPermission("customer", "assign")
  @ApiOperation({
    summary: "转移客户负责人",
    description: "将客户重新分配给新的负责人，并记录权限与数据范围校验。"
  })
  @ApiOkResponse({
    type: CustomerVo
  })
  @ApiCommonErrorResponses({
    badRequest: "负责人 ID 不合法，或目标负责人不满足分配要求。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户分配权限，或目标客户不在可操作范围内。",
    notFound: "未找到指定客户。"
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
    description: "查询单个客户的跟进记录和关联提醒信息。"
  })
  @ApiOkResponse({
    type: FollowUpVo,
    isArray: true
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有客户查询权限，或无权查看该客户。",
    notFound: "未找到指定客户。"
  })
  listFollowUps(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.customersService.listFollowUps(id, user);
  }

  @Post(":id/follow-ups")
  @Permissions("followup:write")
  @ApiOperation({
    summary: "新增客户跟进记录",
    description: "为客户新增一条跟进记录；可选地创建下一次跟进提醒。"
  })
  @ApiOkResponse({
    type: FollowUpVo
  })
  @ApiCommonErrorResponses({
    badRequest: "跟进内容或下次跟进时间格式不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有跟进写入权限，或无权操作该客户。",
    notFound: "未找到指定客户。"
  })
  createFollowUp(
    @Param("id") id: string,
    @Body() dto: CreateCustomerFollowUpDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.customersService.createFollowUp(id, dto, user);
  }
}
