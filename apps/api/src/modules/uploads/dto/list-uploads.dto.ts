/** uploads 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { ApiProperty } from "@nestjs/swagger";
import { AttachmentBusinessType } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class ListUploadsDto {
  @ApiProperty({
    description: "附件所属业务类型。",
    enum: AttachmentBusinessType
  })
  @IsEnum(AttachmentBusinessType)
  businessType!: AttachmentBusinessType;

  @ApiProperty({
    description: "附件所属业务记录 ID。"
  })
  @IsString()
  businessId!: string;
}
