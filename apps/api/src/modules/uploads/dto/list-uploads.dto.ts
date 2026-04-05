import { IsOptional, IsString } from "class-validator";

export class ListUploadsDto {
  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  businessId?: string;
}

