/** OA VO：负责定义 OA 工作台、审批、公告和通讯录的对外响应契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LeaveRequestStatus } from "@prisma/client";

export class AnnouncementSummaryVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "公告标题。"
  })
  title!: string;

  @ApiPropertyOptional({
    description: "公告摘要。",
    nullable: true
  })
  summary?: string | null;

  @ApiProperty({
    description: "发布时间。",
    format: "date-time"
  })
  publishedAt!: string;

  @ApiProperty({
    description: "发布人姓名。"
  })
  publishedByName!: string;
}

export class AnnouncementDetailVo extends AnnouncementSummaryVo {
  @ApiProperty({
    description: "公告正文。"
  })
  content!: string;
}

export class WorkspaceOverviewVo {
  @ApiProperty({
    description: "待我审批数量。"
  })
  pendingApprovalCount!: number;

  @ApiProperty({
    description: "我发起的申请数量。"
  })
  myRequestCount!: number;

  @ApiProperty({
    description: "进行中的公告数量。"
  })
  activeAnnouncementCount!: number;

  @ApiProperty({
    description: "通讯录部门数。"
  })
  directoryDepartmentCount!: number;

  @ApiProperty({
    description: "最近公告摘要。",
    type: () => [AnnouncementSummaryVo]
  })
  recentAnnouncements!: AnnouncementSummaryVo[];
}

export class PendingApprovalItemVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "申请人姓名。"
  })
  applicantName!: string;

  @ApiProperty({
    description: "请假类型。"
  })
  leaveType!: string;

  @ApiProperty({
    description: "开始时间。",
    format: "date-time"
  })
  startAt!: string;

  @ApiProperty({
    description: "结束时间。",
    format: "date-time"
  })
  endAt!: string;

  @ApiProperty({
    description: "请假事由。"
  })
  reason!: string;

  @ApiProperty({
    description: "当前状态。",
    enum: LeaveRequestStatus
  })
  status!: LeaveRequestStatus;

  @ApiProperty({
    description: "申请创建时间。",
    format: "date-time"
  })
  createdAt!: string;
}

export class LeaveRequestItemVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "请假类型。"
  })
  leaveType!: string;

  @ApiProperty({
    description: "开始时间。",
    format: "date-time"
  })
  startAt!: string;

  @ApiProperty({
    description: "结束时间。",
    format: "date-time"
  })
  endAt!: string;

  @ApiProperty({
    description: "请假事由。"
  })
  reason!: string;

  @ApiProperty({
    description: "当前状态。",
    enum: LeaveRequestStatus
  })
  status!: LeaveRequestStatus;

  @ApiPropertyOptional({
    description: "申请人姓名。",
    nullable: true
  })
  applicantName?: string;

  @ApiPropertyOptional({
    description: "当前审批人姓名。",
    nullable: true
  })
  currentApproverName?: string | null;

  @ApiPropertyOptional({
    description: "最近一次审批意见。",
    nullable: true
  })
  latestComment?: string | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}

export class DirectoryDepartmentVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "部门名称。"
  })
  name!: string;

  @ApiProperty({
    description: "部门编码。"
  })
  code!: string;
}

export class DirectoryMemberVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "登录用户名。"
  })
  username!: string;

  @ApiProperty({
    description: "显示名称。"
  })
  displayName!: string;

  @ApiPropertyOptional({
    description: "邮箱。",
    nullable: true
  })
  email?: string | null;

  @ApiPropertyOptional({
    description: "手机号。",
    nullable: true
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: "部门名称。",
    nullable: true
  })
  departmentName?: string | null;
}

export class DirectorySnapshotVo {
  @ApiProperty({
    description: "部门列表。",
    type: () => [DirectoryDepartmentVo]
  })
  departments!: DirectoryDepartmentVo[];

  @ApiProperty({
    description: "成员列表。",
    type: () => [DirectoryMemberVo]
  })
  members!: DirectoryMemberVo[];
}
