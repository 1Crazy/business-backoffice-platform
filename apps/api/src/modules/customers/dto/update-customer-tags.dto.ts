import { IsArray, IsString } from "class-validator";

export class UpdateCustomerTagsDto {
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}

