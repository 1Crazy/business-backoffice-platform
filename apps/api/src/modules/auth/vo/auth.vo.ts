/** auth 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataScope } from "@prisma/client";

export class CurrentUserVo {
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
    description: "访问令牌。"
  })
  accessToken!: string;

  @ApiProperty({
    description: "刷新令牌。"
  })
  refreshToken!: string;

  @ApiProperty({
    description: "当前会话过期时间。",
format: "date-time"
  })
  sessionExpiresAt!: string;

  @ApiProperty({
    type: () => CurrentUserVo
  })
  user!: CurrentUserVo;
}

export class LogoutResponseVo {
  @ApiProperty({
    description: "success 字段。"
  })
  success!: boolean;
}
