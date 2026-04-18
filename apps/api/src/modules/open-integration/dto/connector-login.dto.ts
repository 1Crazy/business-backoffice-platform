import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class ConnectorLoginDto {
  @ApiPropertyOptional({
    description: "外部主体标识。"
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: "外部用户名。"
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: "外部邮箱。"
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "外部显示名。"
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}
