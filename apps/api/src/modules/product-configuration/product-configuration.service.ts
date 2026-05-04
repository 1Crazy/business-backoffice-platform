import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditActionType, ProductConfigLayer, ProductConfigScope } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { RuntimeCacheService } from "@/common/cache/runtime-cache.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { UpsertTenantConfigOverrideDto } from "./dto/upsert-tenant-config-override.dto";
import { mapResolvedConfigEntry, mapRuntimeConfig } from "./mappers/product-configuration.mapper";
import { ProductConfigurationRepository, type ProductConfigRecord } from "./repositories/product-configuration.repository";

type ConfigSeed = {
  layer: ProductConfigLayer;
  scope: ProductConfigScope;
  configKey: string;
  displayName: string;
  description?: string;
  industryCode?: string;
  value: Record<string, unknown>;
};

const PRODUCT_CONFIG_SEEDS: ConfigSeed[] = [
  {
    layer: ProductConfigLayer.PLATFORM_DEFAULT,
    scope: ProductConfigScope.MENU,
    configKey: "platform-workfeed",
    displayName: "统一待办入口",
    description: "控制统一待办/通知导航入口的显示与标签。",
    value: {
      visible: true,
      label: "统一待办/通知"
    }
  },
  {
    layer: ProductConfigLayer.PLATFORM_DEFAULT,
    scope: ProductConfigScope.MENU,
    configKey: "scrm-system",
    displayName: "系统治理入口",
    description: "控制系统管理导航入口的显示与标签。",
    value: {
      visible: true,
      label: "系统管理"
    }
  },
  {
    layer: ProductConfigLayer.PLATFORM_DEFAULT,
    scope: ProductConfigScope.FIELD_SCHEME,
    configKey: "customer-mobile",
    displayName: "客户手机号字段",
    description: "控制客户手机号字段的显示、标签和是否必填。",
    value: {
      visible: true,
      label: "客户手机号",
      required: false
    }
  },
  {
    layer: ProductConfigLayer.PLATFORM_DEFAULT,
    scope: ProductConfigScope.FORM_TEMPLATE,
    configKey: "reimbursement-form",
    displayName: "报销申请表单",
    description: "控制报销表单标题、布局和关键字段。",
    value: {
      title: "报销申请",
      layout: "two-column",
      requiredFields: ["title", "amount", "expenseDate"]
    }
  },
  {
    layer: ProductConfigLayer.PLATFORM_DEFAULT,
    scope: ProductConfigScope.THEME,
    configKey: "brand-kit",
    displayName: "品牌主题",
    description: "控制租户品牌名称和主应用壳层主题色。",
    value: {
      brandName: "Business Backoffice",
      primaryColor: "#2563eb",
      accentColor: "#0f172a",
      surfaceTint: "#eff6ff",
      navigationMode: "compact"
    }
  },
  {
    layer: ProductConfigLayer.PLATFORM_DEFAULT,
    scope: ProductConfigScope.TEMPLATE,
    configKey: "opportunity-playbook",
    displayName: "标准商机作战模板",
    description: "控制经营模板标题、说明和行动按钮文案。",
    value: {
      title: "标准商机作战模板",
      summary: "用于统一销售推进动作、阶段目标和回款协同。",
      ctaLabel: "查看模板"
    }
  },
  {
    layer: ProductConfigLayer.INDUSTRY_TEMPLATE,
    industryCode: "制造业",
    scope: ProductConfigScope.FIELD_SCHEME,
    configKey: "customer-mobile",
    displayName: "制造业客户手机号字段",
    description: "制造业模板强化设备负责人联络信息。",
    value: {
      visible: true,
      label: "设备负责人手机",
      required: true
    }
  },
  {
    layer: ProductConfigLayer.INDUSTRY_TEMPLATE,
    industryCode: "制造业",
    scope: ProductConfigScope.FORM_TEMPLATE,
    configKey: "reimbursement-form",
    displayName: "制造业报销申请表单",
    description: "制造业模板追加成本中心与产线归属。",
    value: {
      title: "制造业费用申请",
      layout: "two-column",
      requiredFields: ["title", "amount", "expenseDate", "costCenter", "productionLine"]
    }
  },
  {
    layer: ProductConfigLayer.INDUSTRY_TEMPLATE,
    industryCode: "制造业",
    scope: ProductConfigScope.THEME,
    configKey: "brand-kit",
    displayName: "制造业品牌主题",
    description: "制造业模板偏冷色、强调稳态运营。",
    value: {
      brandName: "Business Backoffice Manufacturing",
      primaryColor: "#0f766e",
      accentColor: "#134e4a",
      surfaceTint: "#ecfeff",
      navigationMode: "compact"
    }
  },
  {
    layer: ProductConfigLayer.INDUSTRY_TEMPLATE,
    industryCode: "制造业",
    scope: ProductConfigScope.TEMPLATE,
    configKey: "opportunity-playbook",
    displayName: "制造业商机模板",
    description: "制造业模板增加试样、报价和交付承诺要点。",
    value: {
      title: "制造业商机作战模板",
      summary: "强调试样排期、打样确认、报价回签和交付承诺。",
      ctaLabel: "查看制造业模板"
    }
  }
];

@Injectable()
export class ProductConfigurationService {
  constructor(
    private readonly productConfigurationRepository: ProductConfigurationRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly runtimeCacheService: RuntimeCacheService
  ) {}

  async getRuntimeConfig(actor: AuthUser) {
    const tenantId = requireTenantId(actor);

    return this.runtimeCacheService.getOrSet(`product-config:runtime:${tenantId}`, 60_000, async () => {
      const entries = await this.resolveEntries(actor);
      const theme = entries.find((item) => item.scope === ProductConfigScope.THEME && item.configKey === "brand-kit");
      const menuEntries = entries.filter((item) => item.scope === ProductConfigScope.MENU);
      const themeValue = theme?.effectiveValue ?? {};
      const hiddenNavigationKeys = menuEntries
        .filter((item) => item.effectiveValue.visible === false)
        .map((item) => item.configKey);
      const navigationLabels = Object.fromEntries(
        menuEntries
          .map((item) => [item.configKey, typeof item.effectiveValue.label === "string" ? item.effectiveValue.label : null])
          .filter((item): item is [string, string] => typeof item[1] === "string" && item[1].length > 0)
      );

      return mapRuntimeConfig({
        brandName: readString(themeValue.brandName) ?? "Business Backoffice",
        primaryColor: readString(themeValue.primaryColor) ?? "#2563eb",
        accentColor: readString(themeValue.accentColor) ?? "#0f172a",
        surfaceTint: readString(themeValue.surfaceTint) ?? "#eff6ff",
        navigationMode: readString(themeValue.navigationMode) ?? "compact",
        hiddenNavigationKeys,
        navigationLabels
      });
    });
  }

  async listResolvedEntries(actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    return this.runtimeCacheService.getOrSet(`product-config:entries:${tenantId}`, 60_000, () => this.resolveEntries(actor));
  }

  async upsertTenantOverride(scope: ProductConfigScope, configKey: string, dto: UpsertTenantConfigOverrideDto, actor: AuthUser) {
    const resolvedEntries = await this.resolveEntries(actor);
    const targetEntry = resolvedEntries.find((item) => item.scope === scope && item.configKey === configKey);

    if (!targetEntry) {
      throw new NotFoundException("产品配置项不存在。");
    }

    const tenantId = requireTenantId(actor);
    await this.productConfigurationRepository.upsertTenantOverride({
      code: this.buildConfigCode(ProductConfigLayer.TENANT_OVERRIDE, scope, configKey, tenantId),
      tenantId,
      scope,
      configKey,
      displayName: dto.displayName?.trim() || targetEntry.displayName,
      description: dto.description?.trim() || targetEntry.description || undefined,
      value: dto.value
    });

    await this.auditLogsService.create({
      tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "product-config",
      targetId: `${scope}:${configKey}`,
      detail: {
        scope,
        configKey
      }
    });

    this.runtimeCacheService.invalidatePrefix(`product-config:entries:${tenantId}`);
    this.runtimeCacheService.invalidatePrefix(`product-config:runtime:${tenantId}`);

    const nextEntries = await this.resolveEntries(actor);
    return nextEntries.find((item) => item.scope === scope && item.configKey === configKey);
  }

  private async resolveEntries(actor: AuthUser): Promise<ResolvedConfigEntry[]> {
    await this.ensureDefaultConfigs();
    const tenant = await this.productConfigurationRepository.findTenantContext(requireTenantId(actor));
    const configs = await this.productConfigurationRepository.listConfigsForResolution(tenant.id, tenant.industry);
    const grouped = new Map<string, { platformDefault?: ProductConfigRecord; industryTemplate?: ProductConfigRecord; tenantOverride?: ProductConfigRecord }>();

    for (const config of configs) {
      const groupKey = `${config.scope}:${config.configKey}`;
      const current = grouped.get(groupKey) ?? {};

      if (config.layer === ProductConfigLayer.PLATFORM_DEFAULT) {
        current.platformDefault = config;
      } else if (config.layer === ProductConfigLayer.INDUSTRY_TEMPLATE) {
        current.industryTemplate = config;
      } else if (config.layer === ProductConfigLayer.TENANT_OVERRIDE) {
        current.tenantOverride = config;
      }

      grouped.set(groupKey, current);
    }

    return Array.from(grouped.entries())
      .map(([groupKey, group]) => {
        const effective = group.tenantOverride ?? group.industryTemplate ?? group.platformDefault;

        if (!effective) {
          return null;
        }

        const [scope, configKey] = groupKey.split(":");
        const effectiveValue = readObject(effective.value) ?? {};

        return mapResolvedConfigEntry({
          scope: scope as ProductConfigScope,
          configKey,
          displayName: effective.displayName,
          description: effective.description,
          effectiveSource: effective.layer,
          effectiveValue,
          platformDefault: group.platformDefault,
          industryTemplate: group.industryTemplate,
          tenantOverride: group.tenantOverride
        });
      })
      .filter((item): item is ResolvedConfigEntry => item !== null)
      .sort((left, right) => {
        if (left.scope !== right.scope) {
          return left.scope.localeCompare(right.scope);
        }

        return left.configKey.localeCompare(right.configKey);
      });
  }

  private async ensureDefaultConfigs() {
    await this.productConfigurationRepository.ensureConfigs(
      PRODUCT_CONFIG_SEEDS.map((item) => ({
        code: this.buildConfigCode(item.layer, item.scope, item.configKey, undefined, item.industryCode),
        tenantId: undefined,
        industryCode: item.industryCode,
        layer: item.layer,
        scope: item.scope,
        configKey: item.configKey,
        displayName: item.displayName,
        description: item.description,
        value: item.value
      }))
    );
  }

  private buildConfigCode(
    layer: ProductConfigLayer,
    scope: ProductConfigScope,
    configKey: string,
    tenantId?: string,
    industryCode?: string
  ) {
    return [layer, scope, configKey, tenantId ?? "global", industryCode ?? "global"].join(":");
  }
}

type ResolvedConfigEntry = ReturnType<typeof mapResolvedConfigEntry>;

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
