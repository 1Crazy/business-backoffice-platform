import { IsOptional, IsString } from "class-validator";

export class CreateCustomerTagDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

