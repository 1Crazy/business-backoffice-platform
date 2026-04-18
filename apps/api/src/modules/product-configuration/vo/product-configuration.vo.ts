import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProductConfigLayer, ProductConfigScope } from "@prisma/client";

class ProductConfigSourceMetaVo {
  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
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
    enum: ProductConfigScope
  })
  scope!: ProductConfigScope;

  @ApiProperty()
  configKey!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    enum: ProductConfigLayer
  })
  effectiveSource!: ProductConfigLayer;

  @ApiProperty({
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
    type: ProductConfigSourcesVo
  })
  sources!: ProductConfigSourcesVo;
}

export class ProductRuntimeConfigVo {
  @ApiProperty()
  brandName!: string;

  @ApiProperty()
  primaryColor!: string;

  @ApiProperty()
  accentColor!: string;

  @ApiProperty()
  surfaceTint!: string;

  @ApiProperty()
  navigationMode!: string;

  @ApiProperty({
    type: [String]
  })
  hiddenNavigationKeys!: string[];

  @ApiProperty({
    type: "object",
    additionalProperties: true
  })
  navigationLabels!: Record<string, string>;
}
