import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

const CONNECTOR_LOGIN_PROOF_TYPES = ["CLIENT_SECRET", "MOCK"] as const;
export type ConnectorLoginProofType = (typeof CONNECTOR_LOGIN_PROOF_TYPES)[number];

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

  @ApiPropertyOptional({
    description: "登录证明类型。CLIENT_SECRET 用于服务端可验证密钥，MOCK 仅允许本地/测试显式开启。",
    enum: CONNECTOR_LOGIN_PROOF_TYPES
  })
  @IsOptional()
  @IsIn(CONNECTOR_LOGIN_PROOF_TYPES)
  proofType?: ConnectorLoginProofType;

  @ApiPropertyOptional({
    description: "连接器登录证明密钥。生产环境不得使用裸身份字段绕过该证明。"
  })
  @IsOptional()
  @IsString()
  proofSecret?: string;
}
