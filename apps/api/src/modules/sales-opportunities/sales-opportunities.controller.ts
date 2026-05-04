/** sales-opportunities 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { ActionPermission } from "@/common/decorators/action-permission.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { ApiCommonErrorResponses } from "@/common/swagger/common-error-responses.decorator";
import { CreateSalesOpportunityDto } from "./dto/create-sales-opportunity.dto";
import { ListSalesOpportunitiesDto, SALES_OPPORTUNITY_SORT_FIELDS } from "./dto/list-sales-opportunities.dto";
import { PaginatedSalesOpportunitiesResponseDto } from "./dto/list-sales-opportunities-response.dto";
import { MarkSalesOpportunityLostDto } from "./dto/mark-sales-opportunity-lost.dto";
import { MarkSalesOpportunityWonDto } from "./dto/mark-sales-opportunity-won.dto";
import { ReassignSalesOpportunityOwnerDto } from "./dto/reassign-sales-opportunity-owner.dto";
import { UpdateSalesOpportunityStageDto } from "./dto/update-sales-opportunity-stage.dto";
import { UpdateSalesOpportunityDto } from "./dto/update-sales-opportunity.dto";
import { SalesOpportunitiesService } from "./sales-opportunities.service";
import { SalesOpportunityVo } from "./vo/sales-opportunity.vo";

@ApiTags("sales-opportunities")
@ApiBearerAuth()
@Controller("sales-opportunities")
export class SalesOpportunitiesController {
  constructor(private readonly salesOpportunitiesService: SalesOpportunitiesService) {}

  @Get()
  @Permissions("opportunity:read")
  @ApiOperation({
    summary: "分页查询商机列表",
    description: "按关键字、客户、来源线索、阶段、结果状态和时间范围筛选商机列表，并返回统一分页结构。"
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: SALES_OPPORTUNITY_SORT_FIELDS,
    description: "允许的排序字段。"
  })
  @ApiOkResponse({
    type: PaginatedSalesOpportunitiesResponseDto
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有商机查询权限，或超出可访问数据范围。"
  })
  list(@Query() query: ListSalesOpportunitiesDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.list(query, user);
  }

  @Get(":id")
  @Permissions("opportunity:read")
  @ApiOperation({
    summary: "查询商机详情",
    description: "查询单个商机的阶段、负责人、客户、来源线索和经营收口聚合信息。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有商机查询权限，或无权访问该商机。",
    notFound: "未找到指定商机。"
  })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.detail(id, user);
  }

  @Post()
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "创建商机",
    description: "创建新的商机，并关联客户、来源线索、负责人和预计成交信息。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    badRequest: "商机名称、客户、线索、负责人、金额或时间参数不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有商机写入权限，或无权关联目标客户/线索/负责人。"
  })
  create(@Body() dto: CreateSalesOpportunityDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "更新商机",
    description: "更新商机基础资料、预计金额、预计成交日、负责人和下一步动作。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    badRequest: "商机更新参数不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有商机写入权限，或无权修改该商机。",
    notFound: "未找到指定商机。"
  })
  update(@Param("id") id: string, @Body() dto: UpdateSalesOpportunityDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.update(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("opportunity:assign")
  @ActionPermission("opportunity", "assign")
  @ApiOperation({
    summary: "重新分配商机负责人",
    description: "将商机重新分配给新的负责人，并同步校验分配动作权限与数据范围。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    badRequest: "负责人 ID 不合法，或目标负责人不满足分配要求。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有商机分配权限，或目标商机不在可操作范围内。",
    notFound: "未找到指定商机。"
  })
  reassignOwner(
    @Param("id") id: string,
    @Body() dto: ReassignSalesOpportunityOwnerDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.salesOpportunitiesService.reassignOwner(id, dto, user);
  }

  @Patch(":id/stage")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "推进商机阶段",
    description: "将商机推进到新的业务阶段，并可附带阶段变更备注。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    badRequest: "目标阶段或阶段备注不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有商机写入权限，或无权推进该商机阶段。",
    notFound: "未找到指定商机。"
  })
  updateStage(
    @Param("id") id: string,
    @Body() dto: UpdateSalesOpportunityStageDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.salesOpportunitiesService.updateStage(id, dto, user);
  }

  @Patch(":id/mark-won")
  @Permissions("opportunity:write")
  @ActionPermission("opportunity", "close-won")
  @ApiOperation({
    summary: "赢单收口",
    description: "将商机标记为赢单收口，并记录赢单备注，供后续报价、合同与回款场景衔接。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    badRequest: "赢单备注格式不合法，或当前商机状态不允许赢单收口。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有赢单收口权限，或无权操作该商机。",
    notFound: "未找到指定商机。"
  })
  markWon(@Param("id") id: string, @Body() dto: MarkSalesOpportunityWonDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.markWon(id, dto, user);
  }

  @Patch(":id/mark-lost")
  @Permissions("opportunity:write")
  @ActionPermission("opportunity", "close-lost")
  @ApiOperation({
    summary: "输单收口",
    description: "将商机标记为输单收口，并记录输单原因和补充说明。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  @ApiCommonErrorResponses({
    badRequest: "输单原因或备注格式不合法，或当前商机状态不允许输单收口。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有输单收口权限，或无权操作该商机。",
    notFound: "未找到指定商机。"
  })
  markLost(@Param("id") id: string, @Body() dto: MarkSalesOpportunityLostDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.markLost(id, dto, user);
  }
}
