import { Controller, Get, Query } from "@nestjs/common";

import { Permissions } from "../../common/decorators/permissions.decorator";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";
import { AuditLogsService } from "./audit-logs.service";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions("audit-log:read")
  list(@Query() query: ListAuditLogsDto) {
    return this.auditLogsService.list(query);
  }
}

