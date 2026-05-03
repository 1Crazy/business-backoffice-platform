/** auth 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataScope } from "@prisma/client";

export class CurrentUserVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "所属租户 ID。"
  })
  tenantId!: string;

  @ApiProperty({
    description: "所属租户编码。"
  })
  tenantCode!: string;

  @ApiProperty({
    description: "登录用户名。"
  })
  username!: string;

  @ApiProperty({
    description: "显示名称。"
  })
  displayName!: string;

  @ApiPropertyOptional({
    description: "所属部门 ID。",
nullable: true
  })
  departmentId?: string | null;

  @ApiProperty({
    type: () => [String]
  })
  roleCodes!: string[];

  @ApiProperty({
    type: () => [String]
  })
  permissions!: string[];

  @ApiProperty({
    type: () => [String],
    enum: DataScope
  })
  dataScopes!: DataScope[];
}

export class LoginResponseVo {
  @ApiProperty({
    description: "是否已完成登录。未完成时表示仍需 MFA 验证。"
  })
  success!: boolean;

  @ApiProperty({
    description: "是否需要继续完成 MFA 验证。"
  })
  mfaRequired!: boolean;

  @ApiPropertyOptional({
    description: "登录挑战 ticket，仅在 mfaRequired=true 时返回。",
    nullable: true
  })
  mfaTicket?: string | null;

  @ApiPropertyOptional({
    description: "MFA 挑战类型。",
    nullable: true,
    enum: ["totp"]
  })
  mfaChallengeType?: "totp" | null;

  @ApiProperty({
    description: "当前会话过期时间。",
    format: "date-time",
    nullable: true
  })
  sessionExpiresAt!: string | null;

  @ApiPropertyOptional({
    type: () => CurrentUserVo,
    nullable: true
  })
  user!: CurrentUserVo | null;
}

export class LogoutResponseVo {
  @ApiProperty({
    description: "success 字段。"
  })
  success!: boolean;
}

export class UserSessionVo {
  @ApiProperty({
    description: "会话 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "会话所属用户 ID。"
  })
  userId!: string;

  @ApiProperty({
    description: "会话过期时间。",
    format: "date-time"
  })
  expiresAt!: string;

  @ApiPropertyOptional({
    description: "会话撤销时间。",
    format: "date-time",
    nullable: true
  })
  revokedAt!: string | null;

  @ApiPropertyOptional({
    description: "最近活跃时间。",
    format: "date-time",
    nullable: true
  })
  lastSeenAt!: string | null;

  @ApiPropertyOptional({
    description: "最近一次请求 IP。",
    nullable: true
  })
  ipAddress!: string | null;

  @ApiPropertyOptional({
    description: "最近一次请求 User-Agent。",
    nullable: true
  })
  userAgent!: string | null;

  @ApiProperty({
    description: "会话创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "会话更新时间。",
    format: "date-time"
  })
  updatedAt!: string;

  @ApiProperty({
    description: "是否为当前会话。"
  })
  isCurrent!: boolean;

  @ApiProperty({
    description: "是否仍可用于访问或刷新。"
  })
  isActive!: boolean;
}

export class PasswordResetRequestVo {
  @ApiProperty()
  success!: boolean;
}

export class PasswordResetTokenVo {
  @ApiProperty()
  success!: boolean;
}

export class MfaSetupVo {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty({
    description: "当前是否存在待确认的 MFA 绑定。"
  })
  pending!: boolean;

  @ApiPropertyOptional({
    nullable: true
  })
  challenge?: string | null;

  @ApiProperty({
    type: () => [String]
  })
  recoveryCodes!: string[];
}
