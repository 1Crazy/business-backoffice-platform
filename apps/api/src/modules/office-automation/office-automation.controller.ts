/** OA controller：负责 OA 工作台、审批、公告和通讯录相关接口的路由与权限边界。 */
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { ApprovalActionDto } from "./dto/approval-action.dto";
import { CreateAdministrativeRequestDto } from "./dto/create-administrative-request.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { DirectoryQueryDto } from "./dto/directory-query.dto";
import { ListAdministrativeRequestsDto } from "./dto/list-administrative-requests.dto";
import { OfficeAutomationService } from "./office-automation.service";
import {
  AdministrativeRequestDetailVo,
  AdministrativeRequestItemVo,
  AnnouncementDetailVo,
  AnnouncementSummaryVo,
  DirectorySnapshotVo,
  LeaveRequestItemVo,
  PendingApprovalItemVo,
  WorkspaceOverviewVo
} from "./vo/office-automation.vo";

@ApiTags("office-automation")
@ApiBearerAuth()
@Controller("oa")
export class OfficeAutomationController {
  constructor(private readonly officeAutomationService: OfficeAutomationService) {}

  @Get("workspace/overview")
  @Permissions("oa:workspace:view")
  @ApiOperation({
    summary: "查询 OA 工作台摘要",
    description: "查询 OA 工作台摘要。"
  })
  @ApiOkResponse({
    type: WorkspaceOverviewVo
  })
  getWorkspaceOverview(@CurrentUser() user: AuthUser) {
    return this.officeAutomationService.getWorkspaceOverview(user);
  }

  @Get("approvals/pending")
  @Permissions("oa:approval:read")
  @ApiOperation({
    summary: "查询待我审批列表",
    description: "查询当前账号待处理的请假审批。"
  })
  @ApiOkResponse({
    type: PendingApprovalItemVo,
    isArray: true
  })
  getPendingApprovals(@CurrentUser() user: AuthUser) {
    return this.officeAutomationService.getPendingApprovals(user);
  }

  @Get("administrative-requests/pending")
  @Permissions("oa:request:approve")
  @ApiOperation({
    summary: "查询待我审批的行政申请",
    description: "查询当前账号待处理的报销、出差、采购和用印申请。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestItemVo,
    isArray: true
  })
  getPendingAdministrativeApprovals(@CurrentUser() user: AuthUser, @Query() query: ListAdministrativeRequestsDto) {
    return this.officeAutomationService.getPendingAdministrativeApprovals(user, query);
  }

  @Post("approvals/leave-requests/:id/actions")
  @Permissions("oa:approval:write")
  @ApiOperation({
    summary: "提交请假审批动作",
    description: "对指定请假申请执行通过或驳回。"
  })
  @ApiOkResponse({
    type: LeaveRequestItemVo
  })
  decideLeaveRequest(@Param("id") id: string, @Body() dto: ApprovalActionDto, @CurrentUser() user: AuthUser) {
    return this.officeAutomationService.decideLeaveRequest(id, dto, user);
  }

  @Post("administrative-requests/:id/actions")
  @Permissions("oa:request:approve")
  @ApiOperation({
    summary: "提交行政申请审批动作",
    description: "对指定行政申请执行通过或驳回。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestItemVo
  })
  decideAdministrativeRequest(@Param("id") id: string, @Body() dto: ApprovalActionDto, @CurrentUser() user: AuthUser) {
    return this.officeAutomationService.decideAdministrativeRequest(id, dto, user);
  }

  @Post("administrative-requests/:id/cancel")
  @Permissions("oa:request:apply")
  @ApiOperation({
    summary: "撤回行政申请",
    description: "由申请人撤回仍处于待审批状态的行政申请。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestItemVo
  })
  cancelAdministrativeRequest(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.officeAutomationService.cancelAdministrativeRequest(id, user);
  }

  @Get("leaves/mine")
  @Permissions("oa:leave:apply")
  @ApiOperation({
    summary: "查询我发起的请假申请",
    description: "查询当前账号发起的请假申请列表。"
  })
  @ApiOkResponse({
    type: LeaveRequestItemVo,
    isArray: true
  })
  getMyLeaveRequests(@CurrentUser() user: AuthUser) {
    return this.officeAutomationService.getMyLeaveRequests(user);
  }

  @Get("administrative-requests/mine")
  @Permissions("oa:request:apply")
  @ApiOperation({
    summary: "查询我发起的行政申请",
    description: "查询当前账号发起的报销、出差、采购和用印申请列表。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestItemVo,
    isArray: true
  })
  getMyAdministrativeRequests(@CurrentUser() user: AuthUser, @Query() query: ListAdministrativeRequestsDto) {
    return this.officeAutomationService.getMyAdministrativeRequests(user, query);
  }

  @Get("administrative-requests")
  @Permissions("oa:request:read")
  @ApiOperation({
    summary: "检索行政申请",
    description: "按申请类型、申请人、审批人、状态与时间范围检索行政申请。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestItemVo,
    isArray: true
  })
  listAdministrativeRequests(@Query() query: ListAdministrativeRequestsDto) {
    return this.officeAutomationService.listAdministrativeRequests(query);
  }

  @Get("administrative-requests/:id")
  @ApiOperation({
    summary: "查询行政申请详情",
    description: "查询行政申请详情、结构化字段和审批轨迹。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestDetailVo
  })
  getAdministrativeRequestDetail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.officeAutomationService.getAdministrativeRequestDetail(id, user);
  }

  @Post("leaves")
  @Permissions("oa:leave:apply")
  @ApiOperation({
    summary: "提交请假申请",
    description: "提交一条新的请假申请。"
  })
  @ApiOkResponse({
    type: LeaveRequestItemVo
  })
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: AuthUser) {
    return this.officeAutomationService.createLeaveRequest(dto, user);
  }

  @Post("administrative-requests")
  @Permissions("oa:request:apply")
  @ApiOperation({
    summary: "提交行政申请",
    description: "提交一条新的高频行政申请。"
  })
  @ApiOkResponse({
    type: AdministrativeRequestItemVo
  })
  createAdministrativeRequest(@Body() dto: CreateAdministrativeRequestDto, @CurrentUser() user: AuthUser) {
    return this.officeAutomationService.createAdministrativeRequest(dto, user);
  }

  @Get("announcements")
  @Permissions("oa:announcement:read")
  @ApiOperation({
    summary: "查询公告列表",
    description: "查询 OA 公告列表。"
  })
  @ApiOkResponse({
    type: AnnouncementSummaryVo,
    isArray: true
  })
  getAnnouncements() {
    return this.officeAutomationService.getAnnouncements();
  }

  @Get("announcements/:id")
  @Permissions("oa:announcement:read")
  @ApiOperation({
    summary: "查询公告详情",
    description: "查询单条 OA 公告详情。"
  })
  @ApiOkResponse({
    type: AnnouncementDetailVo
  })
  getAnnouncementDetail(@Param("id") id: string) {
    return this.officeAutomationService.getAnnouncementDetail(id);
  }

  @Get("directory")
  @Permissions("oa:directory:read")
  @ApiOperation({
    summary: "查询组织通讯录",
    description: "按部门查询 OA 通讯录成员。"
  })
  @ApiOkResponse({
    type: DirectorySnapshotVo
  })
  getDirectorySnapshot(@Query() query: DirectoryQueryDto) {
    return this.officeAutomationService.getDirectorySnapshot(query.departmentId);
  }
}
