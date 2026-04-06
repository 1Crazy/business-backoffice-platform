/** auth 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "登录用户名。"
  })
  @IsString()
  username!: string;

  @ApiProperty({
    description: "登录密码，最少 6 位。"
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
