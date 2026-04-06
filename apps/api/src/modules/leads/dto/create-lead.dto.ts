/** leads 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateLeadDto {
  @ApiProperty({
    description: "线索名称。"
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: "联系人姓名。"
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: "联系电话。"
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: "线索来源。"
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: "线索备注。"
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: "负责人 ID；不传时默认归当前操作人。"
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
