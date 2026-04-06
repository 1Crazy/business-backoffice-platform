/** dashboard 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardService } from "./dashboard.service";
import { DashboardOverviewVo } from "./vo/dashboard-overview.vo";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("overview")
  @Permissions("dashboard:view")
  @ApiOperation({
    summary: "查询看板概览统计",
    description: "查询看板概览统计。"
  })
  @ApiOkResponse({
    type: DashboardOverviewVo
  })
  overview(@Query() query: DashboardQueryDto, @CurrentUser() user: AuthUser) {
    return this.dashboardService.overview(query, user);
  }
}
