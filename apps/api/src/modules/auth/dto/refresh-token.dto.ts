/** auth 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: "刷新令牌。兼容迁移期支持请求体传入；优先使用 HttpOnly Cookie。"
  })
  @IsOptional()
  @IsString()
  @MinLength(32)
  refreshToken?: string;
}
