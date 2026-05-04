import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GovernanceHealthStatus, RecordStatus } from "@prisma/client";

class TenantQuotasVo {
  @ApiProperty({
    description: "租户可用员工数配额。"
  })
  users!: number;

  @ApiProperty({
    description: "租户可用存储配额，单位 MB。"
  })
  storageQuotaMb!: number;

  @ApiProperty({
    description: "租户每月可执行任务配额。"
  })
  monthlyTasks!: number;
}

class TenantUsageVo {
  @ApiProperty({
    description: "租户员工总数。"
  })
  totalUsers!: number;

  @ApiProperty({
    description: "租户活跃员工数。"
  })
  activeUsers!: number;

  @ApiProperty({
    description: "租户已用存储量，单位 MB。"
  })
  storageUsedMb!: number;

  @ApiProperty({
    description: "租户当月已执行任务数。"
  })
  monthlyTasks!: number;

  @ApiProperty({
    description: "最近 30 天失败任务数。"
  })
  failedTasksLast30Days!: number;

  @ApiProperty({
    description: "最近 7 天通知失败次数。"
  })
  notificationFailuresLast7Days!: number;

  @ApiPropertyOptional({
    description: "最近活跃时间。",
    nullable: true,
    format: "date-time"
  })
  lastActivityAt?: string | null;
}

export class TenantOperationsSnapshotVo {
  @ApiProperty({
    description: "租户 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "租户编码。"
  })
  code!: string;

  @ApiProperty({
    description: "租户名称。"
  })
  name!: string;

  @ApiProperty({
    description: "租户状态。",
    enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiProperty({
    description: "租户生命周期状态。",
    enum: ["ACTIVE", "DISABLED", "ARCHIVED"]
  })
  lifecycleStatus!: "ACTIVE" | "DISABLED" | "ARCHIVED";

  @ApiProperty({
    description: "是否为系统默认租户。"
  })
  isDefault!: boolean;

  @ApiPropertyOptional({
    description: "租户所属行业。",
    nullable: true
  })
  industry?: string | null;

  @ApiProperty({
    description: "租户当前套餐名称。"
  })
  planName!: string;

  @ApiProperty({
    description: "租户负责人姓名。"
  })
  ownerName!: string;

  @ApiProperty({
    description: "租户负责人邮箱。"
  })
  ownerEmail!: string;

  @ApiPropertyOptional({
    description: "租户负责人手机号。",
    nullable: true
  })
  ownerPhone?: string | null;

  @ApiPropertyOptional({
    description: "租户初始化完成时间。",
    nullable: true,
    format: "date-time"
  })
  initializedAt?: string | null;

  @ApiPropertyOptional({
    description: "租户停用时间。",
    nullable: true,
    format: "date-time"
  })
  disabledAt?: string | null;

  @ApiPropertyOptional({
    description: "租户归档时间。",
    nullable: true,
    format: "date-time"
  })
  archivedAt?: string | null;

  @ApiProperty({
    description: "租户创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "租户更新时间。",
    format: "date-time"
  })
  updatedAt!: string;

  @ApiProperty({
    description: "租户配额信息。",
    type: TenantQuotasVo
  })
  quotas!: TenantQuotasVo;

  @ApiProperty({
    description: "租户使用量统计。",
    type: TenantUsageVo
  })
  usage!: TenantUsageVo;

  @ApiProperty({
    description: "租户运行健康状态。",
    enum: GovernanceHealthStatus
  })
  runtimeStatus!: GovernanceHealthStatus;

  @ApiProperty({
    description: "租户运行摘要提示列表。",
    type: [String]
  })
  runtimeHighlights!: string[];
}
