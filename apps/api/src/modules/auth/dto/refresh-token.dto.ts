/** auth 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    description: "刷新令牌。"
  })
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}
