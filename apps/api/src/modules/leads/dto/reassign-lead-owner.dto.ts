import { IsString } from "class-validator";

export class ReassignLeadOwnerDto {
  @IsString()
  ownerId!: string;
}

