import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateCustomerFollowUpDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}

