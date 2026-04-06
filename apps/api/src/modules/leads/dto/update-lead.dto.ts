/** leads 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { IsEnum, IsOptional, IsString } from "class-validator";
import { LeadStatus } from "@prisma/client";

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}

