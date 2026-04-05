import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateDictionaryEntryDto {
  @IsString()
  type!: string;

  @IsString()
  label!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

