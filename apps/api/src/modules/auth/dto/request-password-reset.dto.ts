import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class RequestPasswordResetDto {
  @ApiProperty({
    description: "用户名或已验证邮箱。"
  })
  @IsString()
  @MinLength(3)
  identifier!: string;
}
