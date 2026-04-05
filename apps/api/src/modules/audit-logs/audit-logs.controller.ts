import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { Permissions } from "../../common/decorators/permissions.decorator";
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
    summary: "分页查询审计日志"
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
  list(@Query() query: ListAuditLogsDto) {
    return this.auditLogsService.list(query);
  }
}
