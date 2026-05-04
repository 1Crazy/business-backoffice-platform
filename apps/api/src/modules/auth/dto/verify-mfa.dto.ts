import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyMfaDto {
  @ApiProperty({
    description: "认证器一次性验证码或恢复码。"
  })
  @IsString()
  code!: string;
}
