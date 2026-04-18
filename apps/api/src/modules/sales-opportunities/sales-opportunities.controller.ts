/** sales-opportunities 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { ActionPermission } from "@/common/decorators/action-permission.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
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
    description: "分页查询商机列表。"
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
  list(@Query() query: ListSalesOpportunitiesDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.list(query, user);
  }

  @Get(":id")
  @Permissions("opportunity:read")
  @ApiOperation({
    summary: "查询商机详情",
    description: "查询商机详情。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.detail(id, user);
  }

  @Post()
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "创建商机",
    description: "创建商机。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  create(@Body() dto: CreateSalesOpportunityDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "更新商机",
    description: "更新商机。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  update(@Param("id") id: string, @Body() dto: UpdateSalesOpportunityDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.update(id, dto, user);
  }

  @Patch(":id/owner")
  @Permissions("opportunity:assign")
  @ActionPermission("opportunity", "assign")
  @ApiOperation({
    summary: "重新分配商机负责人",
    description: "重新分配商机负责人。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
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
    description: "推进商机阶段。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
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
    description: "赢单收口。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  markWon(@Param("id") id: string, @Body() dto: MarkSalesOpportunityWonDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.markWon(id, dto, user);
  }

  @Patch(":id/mark-lost")
  @Permissions("opportunity:write")
  @ActionPermission("opportunity", "close-lost")
  @ApiOperation({
    summary: "输单收口",
    description: "输单收口。"
  })
  @ApiOkResponse({
    type: SalesOpportunityVo
  })
  markLost(@Param("id") id: string, @Body() dto: MarkSalesOpportunityLostDto, @CurrentUser() user: AuthUser) {
    return this.salesOpportunitiesService.markLost(id, dto, user);
  }
}
