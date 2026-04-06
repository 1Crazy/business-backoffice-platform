/** customers 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { PartialType } from "@nestjs/swagger";

import { CreateCustomerDto } from "./create-customer.dto";

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

