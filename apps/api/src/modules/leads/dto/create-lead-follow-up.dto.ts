import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateLeadFollowUpDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}

