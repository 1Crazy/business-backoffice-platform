import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ConfigureMfaDto {
  @ApiPropertyOptional({
    description: "用于确认待绑定 secret、关闭 MFA 或轮换恢复码的一次性验证码。"
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: "当 action=disable 时，允许使用恢复码作为关闭 MFA 的验证材料。"
  })
  @IsOptional()
  @IsString()
  recoveryCode?: string;

  @ApiPropertyOptional({
    description: "setup 表示开始或确认绑定，rotate-recovery 表示重置恢复码，disable 表示关闭 MFA。"
  })
  @IsOptional()
  @IsString()
  action?: string;
}
