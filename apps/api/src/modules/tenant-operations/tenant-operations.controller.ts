import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantQuotasDto } from "./dto/update-tenant-quotas.dto";
import { TenantOperationsService } from "./tenant-operations.service";
import { TenantOperationsSnapshotVo } from "./vo/tenant-operations.vo";

@ApiTags("tenant-operations")
@ApiBearerAuth()
@Controller("tenant-operations/tenants")
export class TenantOperationsController {
  constructor(private readonly tenantOperationsService: TenantOperationsService) {}

  @Get()
  @Permissions("tenant:read")
  @ApiOperation({
    summary: "查询租户运营列表",
    description: "查询平台租户的生命周期、配额和运行摘要。"
  })
  @ApiOkResponse({
    type: TenantOperationsSnapshotVo,
    isArray: true
  })
  listTenants() {
    return this.tenantOperationsService.listTenants();
  }

  @Post()
  @Permissions("tenant:write")
  @ApiOperation({
    summary: "创建并初始化租户",
    description: "创建租户并同步初始化默认组织、管理员角色和管理员账号。"
  })
  @ApiOkResponse({
    type: TenantOperationsSnapshotVo
  })
  createTenant(@Body() dto: CreateTenantDto, @CurrentUser() user: AuthUser) {
    return this.tenantOperationsService.createTenant(dto, user);
  }

  @Patch(":id/quotas")
  @Permissions("tenant:write")
  @ApiOperation({
    summary: "更新租户配额",
    description: "更新租户的用户、存储和月度任务配额。"
  })
  @ApiOkResponse({
    type: TenantOperationsSnapshotVo
  })
  updateTenantQuotas(@Param("id") id: string, @Body() dto: UpdateTenantQuotasDto, @CurrentUser() user: AuthUser) {
    return this.tenantOperationsService.updateTenantQuotas(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("tenant:write")
  @ApiOperation({
    summary: "启用租户",
    description: "重新启用一个已停用但未归档的租户。"
  })
  @ApiOkResponse({
    type: TenantOperationsSnapshotVo
  })
  enableTenant(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.tenantOperationsService.enableTenant(id, user);
  }

  @Patch(":id/disable")
  @Permissions("tenant:write")
  @ApiOperation({
    summary: "停用租户",
    description: "停用租户并撤销其活跃会话。"
  })
  @ApiOkResponse({
    type: TenantOperationsSnapshotVo
  })
  disableTenant(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.tenantOperationsService.disableTenant(id, user);
  }

  @Patch(":id/archive")
  @Permissions("tenant:write")
  @ApiOperation({
    summary: "归档租户",
    description: "归档租户并保留历史审计和运行轨迹。"
  })
  @ApiOkResponse({
    type: TenantOperationsSnapshotVo
  })
  archiveTenant(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.tenantOperationsService.archiveTenant(id, user);
  }
}
