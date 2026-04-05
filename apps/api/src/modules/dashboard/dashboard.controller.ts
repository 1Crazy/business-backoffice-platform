import { Controller, Get, Query } from "@nestjs/common";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("overview")
  @Permissions("dashboard:view")
  overview(@Query() query: DashboardQueryDto, @CurrentUser() user: AuthUser) {
    return this.dashboardService.overview(query, user);
  }
}

