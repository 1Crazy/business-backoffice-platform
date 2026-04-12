import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ListWorkfeedNotificationsDto } from "./dto/list-workfeed-notifications.dto";
import { ListWorkfeedTodosDto } from "./dto/list-workfeed-todos.dto";
import { MarkWorkfeedNotificationReadDto } from "./dto/mark-workfeed-notification-read.dto";
import { UnifiedWorkfeedService } from "./unified-workfeed.service";
import { WorkfeedNotificationVo, WorkfeedTodoVo } from "./vo/unified-workfeed.vo";

@ApiTags("unified-workfeed")
@ApiBearerAuth()
@Controller("workfeed")
export class UnifiedWorkfeedController {
  constructor(private readonly unifiedWorkfeedService: UnifiedWorkfeedService) {}

  @Get("todos")
  @ApiOperation({
    summary: "查询统一待办",
    description: "聚合 OA 审批、SCRM 跟进提醒和续费提醒等统一待办。"
  })
  @ApiOkResponse({
    type: WorkfeedTodoVo,
    isArray: true
  })
  listTodos(@Query() query: ListWorkfeedTodosDto, @CurrentUser() user: AuthUser) {
    return this.unifiedWorkfeedService.listTodos(query, user);
  }

  @Get("notifications")
  @ApiOperation({
    summary: "查询统一通知",
    description: "聚合审批结果、公告和经营提醒等统一通知。"
  })
  @ApiOkResponse({
    type: WorkfeedNotificationVo,
    isArray: true
  })
  listNotifications(@Query() query: ListWorkfeedNotificationsDto, @CurrentUser() user: AuthUser) {
    return this.unifiedWorkfeedService.listNotifications(query, user);
  }

  @Post("notifications/read")
  @ApiOperation({
    summary: "标记通知已读",
    description: "将指定统一通知标记为已读。"
  })
  markNotificationRead(@Body() dto: MarkWorkfeedNotificationReadDto, @CurrentUser() user: AuthUser) {
    return this.unifiedWorkfeedService.markNotificationRead(dto, user);
  }
}
