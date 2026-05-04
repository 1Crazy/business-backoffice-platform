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
    description: "登录密码，至少 12 位且包含大小写字母、数字和符号。"
  })
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: "密码至少 12 位，且需包含大写字母、小写字母、数字和符号。"
  })
  password!: string;

}
