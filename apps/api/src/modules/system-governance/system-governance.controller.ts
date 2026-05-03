/** system-governance 模块控制器：负责暴露治理配置、调度任务和执行记录接口。 */
import { Controller, Get, Param, Patch, Post, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { UpdateNotificationChannelConfigDto } from "./dto/update-notification-channel-config.dto";
import { UpdateSchedulerJobDto } from "./dto/update-scheduler-job.dto";
import { UpdateStorageConfigDto } from "./dto/update-storage-config.dto";
import { SystemGovernanceService } from "./system-governance.service";
import {
  NotificationChannelConfigVo,
  PersonalDataAnonymizationVo,
  PersonalDataExportVo,
  SchedulerJobExecutionVo,
  SchedulerJobVo,
  StorageConfigVo
} from "./vo/system-governance.vo";

@ApiTags("system-governance")
@ApiBearerAuth()
@Controller("system-governance")
export class SystemGovernanceController {
  constructor(private readonly systemGovernanceService: SystemGovernanceService) {}

  @Get("notification-channels")
  @Permissions("system-governance:read")
  @ApiOperation({
    summary: "查询通知渠道治理配置",
    description: "查询通知渠道开关、回退策略和近期失败情况。"
  })
  @ApiOkResponse({
    type: NotificationChannelConfigVo,
    isArray: true
  })
  listNotificationChannels() {
    return this.systemGovernanceService.listNotificationChannels();
  }

  @Patch("notification-channels/:adapterCode")
  @Permissions("system-governance:write")
  @ApiOperation({
    summary: "更新通知渠道治理配置",
    description: "更新通知渠道的启停状态和治理配置。"
  })
  @ApiOkResponse({
    type: NotificationChannelConfigVo
  })
  updateNotificationChannel(
    @Param("adapterCode") adapterCode: string,
    @Body() dto: UpdateNotificationChannelConfigDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.systemGovernanceService.updateNotificationChannel(adapterCode, dto, user);
  }

  @Get("storage-configs")
  @Permissions("system-governance:read")
  @ApiOperation({
    summary: "查询存储治理配置",
    description: "查询受支持存储配置的启用状态、预览策略和健康状态。"
  })
  @ApiOkResponse({
    type: StorageConfigVo,
    isArray: true
  })
  listStorageConfigs() {
    return this.systemGovernanceService.listStorageConfigs();
  }

  @Patch("storage-configs/:code")
  @Permissions("system-governance:write")
  @ApiOperation({
    summary: "更新存储治理配置",
    description: "更新存储配置的预览策略、状态和描述信息。"
  })
  @ApiOkResponse({
    type: StorageConfigVo
  })
  updateStorageConfig(@Param("code") code: string, @Body() dto: UpdateStorageConfigDto, @CurrentUser() user: AuthUser) {
    return this.systemGovernanceService.updateStorageConfig(code, dto, user);
  }

  @Get("scheduler-jobs")
  @Permissions("system-governance:read")
  @ApiOperation({
    summary: "查询调度任务治理列表",
    description: "查询调度任务状态、Cron 配置和最近执行结果。"
  })
  @ApiOkResponse({
    type: SchedulerJobVo,
    isArray: true
  })
  listSchedulerJobs() {
    return this.systemGovernanceService.listSchedulerJobs();
  }

  @Get("scheduler-jobs/:code/executions")
  @Permissions("system-governance:read")
  @ApiOperation({
    summary: "查询调度任务执行记录",
    description: "查询指定调度任务最近的执行记录与失败信息。"
  })
  @ApiOkResponse({
    type: SchedulerJobExecutionVo,
    isArray: true
  })
  listSchedulerJobExecutions(@Param("code") code: string) {
    return this.systemGovernanceService.listSchedulerJobExecutions(code);
  }

  @Patch("scheduler-jobs/:code")
  @Permissions("system-governance:write")
  @ApiOperation({
    summary: "更新调度任务治理配置",
    description: "更新调度任务状态、负责人和 Cron 表达式。"
  })
  @ApiOkResponse({
    type: SchedulerJobVo
  })
  updateSchedulerJob(@Param("code") code: string, @Body() dto: UpdateSchedulerJobDto, @CurrentUser() user: AuthUser) {
    return this.systemGovernanceService.updateSchedulerJob(code, dto, user);
  }

  @Post("scheduler-jobs/:code/run")
  @Permissions("system-governance:write")
  @ApiOperation({
    summary: "手动执行调度任务",
    description: "手动触发一次调度任务并生成执行记录。"
  })
  @ApiOkResponse({
    type: SchedulerJobExecutionVo
  })
  runSchedulerJob(@Param("code") code: string, @CurrentUser() user: AuthUser) {
    return this.systemGovernanceService.runSchedulerJob(code, user);
  }

  @Post("privacy/users/:id/export")
  @Permissions("system-governance:write")
  @ApiOperation({
    summary: "导出用户个人数据",
    description: "导出指定用户在系统内的个人数据快照。"
  })
  @ApiOkResponse({
    type: PersonalDataExportVo
  })
  exportPersonalData(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.systemGovernanceService.exportPersonalData(id, user);
  }

  @Post("privacy/users/:id/anonymize")
  @Permissions("system-governance:write")
  @ApiOperation({
    summary: "匿名化用户个人数据",
    description: "对指定用户的个人标识字段执行受控匿名化。"
  })
  @ApiOkResponse({
    type: PersonalDataAnonymizationVo
  })
  anonymizePersonalData(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.systemGovernanceService.anonymizePersonalData(id, user);
  }
}
