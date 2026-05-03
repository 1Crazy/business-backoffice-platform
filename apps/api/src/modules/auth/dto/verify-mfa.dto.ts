import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyMfaDto {
  @ApiProperty()
  @IsString()
  code!: string;
}
