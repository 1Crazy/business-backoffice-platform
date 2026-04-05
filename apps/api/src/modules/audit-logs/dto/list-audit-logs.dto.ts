import { IsOptional, IsString } from "class-validator";

export class ListAuditLogsDto {
  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  actorName?: string;
}

