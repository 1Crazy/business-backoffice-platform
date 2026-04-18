/** 通知中心控制器：负责暴露站内消息列表、已读和偏好管理接口。 */
import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ListNotificationRecordsDto } from "./dto/list-notification-records.dto";
import { UpsertNotificationPreferencesDto } from "./dto/upsert-notification-preferences.dto";
import { NotificationCenterService } from "./notification-center.service";
import { NotificationPreferenceVo, NotificationRecordVo } from "./vo/notification-center.vo";

@ApiTags("notification-center")
@ApiBearerAuth()
@Controller("notification-center")
export class NotificationCenterController {
  constructor(private readonly notificationCenterService: NotificationCenterService) {}

  @Get("notifications")
  @ApiOperation({
    summary: "查询站内消息中心",
    description: "查询当前账号的统一通知记录和渠道投递结果。"
  })
  @ApiOkResponse({
    type: NotificationRecordVo,
    isArray: true
  })
  listNotifications(@Query() query: ListNotificationRecordsDto, @CurrentUser() user: AuthUser) {
    return this.notificationCenterService.listNotifications(query, user);
  }

  @Post("notifications/:id/read")
  @ApiOperation({
    summary: "标记通知已读",
    description: "将通知中心中的单条记录标记为已读。"
  })
  @ApiOkResponse({
    type: NotificationRecordVo
  })
  markNotificationRead(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.notificationCenterService.markNotificationRead(id, user);
  }

  @Get("preferences")
  @ApiOperation({
    summary: "查询通知偏好",
    description: "查询当前账号的通知订阅、渠道偏好和催办阈值设置。"
  })
  @ApiOkResponse({
    type: NotificationPreferenceVo,
    isArray: true
  })
  listPreferences(@CurrentUser() user: AuthUser) {
    return this.notificationCenterService.listPreferences(user);
  }

  @Put("preferences")
  @ApiOperation({
    summary: "保存通知偏好",
    description: "批量保存当前账号的订阅规则、渠道偏好和催办参数。"
  })
  @ApiOkResponse({
    type: NotificationPreferenceVo,
    isArray: true
  })
  updatePreferences(@Body() dto: UpsertNotificationPreferencesDto, @CurrentUser() user: AuthUser) {
    return this.notificationCenterService.updatePreferences(dto, user);
  }
}
