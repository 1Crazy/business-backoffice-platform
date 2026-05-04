/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ReassignCustomerOwnerDto {
  @ApiProperty({
    description: "新的客户负责人员工 ID。"
  })
  @IsString()
  ownerId!: string;
}
