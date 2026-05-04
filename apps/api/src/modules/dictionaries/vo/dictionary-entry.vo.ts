/** dictionaries 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty } from "@nestjs/swagger";

export class DictionaryEntryVo {
  @ApiProperty({
    description: "字典项 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "类型。"
  })
  type!: string;

  @ApiProperty({
    description: "显示标签。"
  })
  label!: string;

  @ApiProperty({
    description: "字典值。"
  })
  value!: string;

  @ApiProperty({
    description: "排序值。"
  })
  sort!: number;

  @ApiProperty({
    description: "是否启用。"
  })
  enabled!: boolean;
}
