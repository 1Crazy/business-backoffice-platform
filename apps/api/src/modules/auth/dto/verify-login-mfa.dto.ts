import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyLoginMfaDto {
  @ApiProperty({
    description: "登录挑战阶段返回的一次性 ticket。"
  })
  @IsString()
  ticket!: string;

  @ApiProperty({
    description: "认证器一次性验证码或恢复码。"
  })
  @IsString()
  code!: string;
}
