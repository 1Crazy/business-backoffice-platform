import { Injectable } from "@nestjs/common";
import { Prisma, ProductConfigLayer, ProductConfigScope } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

const productConfigSelect = Prisma.validator<Prisma.ProductConfigSelect>()({
  id: true,
  code: true,
  tenantId: true,
  industryCode: true,
  layer: true,
  scope: true,
  configKey: true,
  displayName: true,
  description: true,
  value: true,
  createdAt: true,
  updatedAt: true
});

const tenantContextSelect = Prisma.validator<Prisma.TenantSelect>()({
  id: true,
  code: true,
  name: true,
  industry: true
});

export type ProductConfigRecord = Prisma.ProductConfigGetPayload<{
  select: typeof productConfigSelect;
}>;

export type TenantConfigContextRecord = Prisma.TenantGetPayload<{
  select: typeof tenantContextSelect;
}>;

@Injectable()
export class ProductConfigurationRepository {
  constructor(private readonly prisma: PrismaService) {}

  ensureConfigs(
    configs: Array<{
      code: string;
      tenantId?: string | null;
      industryCode?: string | null;
      layer: ProductConfigLayer;
      scope: ProductConfigScope;
      configKey: string;
      displayName: string;
      description?: string | null;
      value: Record<string, unknown>;
    }>
  ) {
    return this.prisma.$transaction(
      configs.map((item) =>
        this.prisma.productConfig.upsert({
          where: {
            code: item.code
          },
          update: {},
          create: {
            code: item.code,
            tenantId: item.tenantId ?? undefined,
            industryCode: item.industryCode ?? undefined,
            layer: item.layer,
            scope: item.scope,
            configKey: item.configKey,
            displayName: item.displayName,
            description: item.description ?? undefined,
            value: item.value as Prisma.InputJsonObject
          },
          select: productConfigSelect
        })
      )
    );
  }

  findTenantContext(tenantId: string): Promise<TenantConfigContextRecord> {
    return this.prisma.tenant.findUniqueOrThrow({
      where: {
        id: tenantId
      },
      select: tenantContextSelect
    });
  }

  listConfigsForResolution(tenantId: string, industryCode?: string | null): Promise<ProductConfigRecord[]> {
    return this.prisma.productConfig.findMany({
      where: {
        OR: [
          {
            layer: ProductConfigLayer.PLATFORM_DEFAULT
          },
          industryCode
            ? {
                layer: ProductConfigLayer.INDUSTRY_TEMPLATE,
                industryCode
              }
            : undefined,
          {
            layer: ProductConfigLayer.TENANT_OVERRIDE,
            tenantId
          }
        ].filter(Boolean) as Prisma.ProductConfigWhereInput[]
      },
      select: productConfigSelect,
      orderBy: [{ scope: "asc" }, { configKey: "asc" }, { updatedAt: "desc" }]
    });
  }

  upsertTenantOverride(input: {
    code: string;
    tenantId: string;
    scope: ProductConfigScope;
    configKey: string;
    displayName: string;
    description?: string | null;
    value: Record<string, unknown>;
  }) {
    return this.prisma.productConfig.upsert({
      where: {
        code: input.code
      },
      update: {
        displayName: input.displayName,
        description: input.description ?? undefined,
        value: input.value as Prisma.InputJsonObject
      },
      create: {
        code: input.code,
        tenantId: input.tenantId,
        layer: ProductConfigLayer.TENANT_OVERRIDE,
        scope: input.scope,
        configKey: input.configKey,
        displayName: input.displayName,
        description: input.description ?? undefined,
        value: input.value as Prisma.InputJsonObject
      },
      select: productConfigSelect
    });
  }
}
