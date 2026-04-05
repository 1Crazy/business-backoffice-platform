import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataScope } from "@prisma/client";

export class CurrentUserVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
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
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({
    format: "date-time"
  })
  sessionExpiresAt!: string;

  @ApiProperty({
    type: () => CurrentUserVo
  })
  user!: CurrentUserVo;
}

export class LogoutResponseVo {
  @ApiProperty()
  success!: boolean;
}
