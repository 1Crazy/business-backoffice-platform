import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GovernanceHealthStatus, RecordStatus } from "@prisma/client";

class TenantQuotasVo {
  @ApiProperty()
  users!: number;

  @ApiProperty()
  storageQuotaMb!: number;

  @ApiProperty()
  monthlyTasks!: number;
}

class TenantUsageVo {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty()
  storageUsedMb!: number;

  @ApiProperty()
  monthlyTasks!: number;

  @ApiProperty()
  failedTasksLast30Days!: number;

  @ApiProperty()
  notificationFailuresLast7Days!: number;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  lastActivityAt?: string | null;
}

export class TenantOperationsSnapshotVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiProperty({
    enum: ["ACTIVE", "DISABLED", "ARCHIVED"]
  })
  lifecycleStatus!: "ACTIVE" | "DISABLED" | "ARCHIVED";

  @ApiProperty()
  isDefault!: boolean;

  @ApiPropertyOptional({
    nullable: true
  })
  industry?: string | null;

  @ApiProperty()
  planName!: string;

  @ApiProperty()
  ownerName!: string;

  @ApiProperty()
  ownerEmail!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  ownerPhone?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  initializedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  disabledAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  archivedAt?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;

  @ApiProperty({
    type: TenantQuotasVo
  })
  quotas!: TenantQuotasVo;

  @ApiProperty({
    type: TenantUsageVo
  })
  usage!: TenantUsageVo;

  @ApiProperty({
    enum: GovernanceHealthStatus
  })
  runtimeStatus!: GovernanceHealthStatus;

  @ApiProperty({
    type: [String]
  })
  runtimeHighlights!: string[];
}
