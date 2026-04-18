/** audit-logs 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { PaginatedAuditLogsResponseDto } from "./dto/list-audit-logs-response.dto";
import { AUDIT_LOG_SORT_FIELDS, ListAuditLogsDto } from "./dto/list-audit-logs.dto";
import { AuditLogsService } from "./audit-logs.service";

@ApiTags("audit-logs")
@ApiBearerAuth()
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions("audit-log:read")
  @ApiOperation({
    summary: "分页查询审计日志",
    description: "分页查询审计日志。"
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: AUDIT_LOG_SORT_FIELDS,
    description: "允许的排序字段。"
  })
  @ApiOkResponse({
    type: PaginatedAuditLogsResponseDto
  })
  list(@Query() query: ListAuditLogsDto, @CurrentUser() user: AuthUser) {
    return this.auditLogsService.list(query, user);
  }
}
