import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ListDictionariesDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === "true"))
  @IsBoolean()
  enabled?: boolean;
}

