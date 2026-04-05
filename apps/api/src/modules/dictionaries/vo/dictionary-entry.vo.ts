import { ApiProperty } from "@nestjs/swagger";

export class DictionaryEntryVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  sort!: number;

  @ApiProperty()
  enabled!: boolean;
}
