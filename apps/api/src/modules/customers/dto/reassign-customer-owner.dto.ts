import { IsString } from "class-validator";

export class ReassignCustomerOwnerDto {
  @IsString()
  ownerId!: string;
}

