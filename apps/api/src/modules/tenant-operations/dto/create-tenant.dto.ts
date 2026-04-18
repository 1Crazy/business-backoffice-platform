import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from "class-validator";

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9-]{2,32}$/)
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiProperty()
  @IsString()
  ownerName!: string;

  @ApiProperty()
  @IsEmail()
  ownerEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_.-]{2,31}$/)
  adminUsername!: string;

  @ApiProperty()
  @IsString()
  adminDisplayName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  adminPassword!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  userQuota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(128)
  @Max(1048576)
  storageQuotaMb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(10000000)
  monthlyTaskQuota?: number;
}
