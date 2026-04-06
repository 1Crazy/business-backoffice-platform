/** OA controller：负责 OA 工作台、审批、公告和通讯录相关接口的路由与权限边界。 */
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { ApprovalActionDto } from "./dto/approval-action.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { DirectoryQueryDto } from "./dto/directory-query.dto";
import { OfficeAutomationService } from "./office-automation.service";
import {
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
