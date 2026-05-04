import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProductConfigLayer, ProductConfigScope } from "@prisma/client";

class ProductConfigSourceMetaVo {
  @ApiProperty({
    description: "配置来源展示名称。"
  })
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: "配置来源最近更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}

class ProductConfigSourcesVo {
  @ApiPropertyOptional({
    nullable: true,
    type: ProductConfigSourceMetaVo
  })
  platformDefault?: ProductConfigSourceMetaVo | null;

  @ApiPropertyOptional({
    nullable: true,
    type: ProductConfigSourceMetaVo
  })
  industryTemplate?: ProductConfigSourceMetaVo | null;

  @ApiPropertyOptional({
    nullable: true,
    type: ProductConfigSourceMetaVo
  })
  tenantOverride?: ProductConfigSourceMetaVo | null;
}

export class ProductConfigEntryVo {
  @ApiProperty({
    description: "配置适用范围。",
    enum: ProductConfigScope
  })
  scope!: ProductConfigScope;

  @ApiProperty({
    description: "配置项键。"
  })
  configKey!: string;

  @ApiProperty({
    description: "配置项展示名称。"
  })
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: "当前生效配置来源层级。",
    enum: ProductConfigLayer
  })
  effectiveSource!: ProductConfigLayer;

  @ApiProperty({
    description: "当前生效配置值。",
    type: "object",
    additionalProperties: true
  })
  effectiveValue!: Record<string, unknown>;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  platformDefaultValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  industryTemplateValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  tenantOverrideValue?: Record<string, unknown> | null;

  @ApiProperty({
    description: "各层配置来源摘要。",
    type: ProductConfigSourcesVo
  })
  sources!: ProductConfigSourcesVo;
}

export class ProductRuntimeConfigVo {
  @ApiProperty({
    description: "运行时品牌名称。"
  })
  brandName!: string;

  @ApiProperty({
    description: "运行时主色。"
  })
  primaryColor!: string;

  @ApiProperty({
    description: "运行时强调色。"
  })
  accentColor!: string;

  @ApiProperty({
    description: "运行时表面色。"
  })
  surfaceTint!: string;

  @ApiProperty({
    description: "运行时导航模式。"
  })
  navigationMode!: string;

  @ApiProperty({
    description: "运行时隐藏的导航项键列表。",
    type: [String]
  })
  hiddenNavigationKeys!: string[];

  @ApiProperty({
    description: "运行时导航文案映射。",
    type: "object",
    additionalProperties: true
  })
  navigationLabels!: Record<string, string>;
}
