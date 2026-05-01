/** auth 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "登录用户名。"
  })
  @IsString()
  username!: string;

  @ApiProperty({
    description: "登录密码，至少 8 位且包含字母和数字。"
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "password must contain letters and numbers"
  })
  password!: string;
}
