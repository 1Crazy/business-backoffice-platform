import { ProductConfigLayer, ProductConfigScope } from "@prisma/client";

import { RuntimeCacheService } from "../src/common/cache/runtime-cache.service";
import { ProductConfigurationService } from "../src/modules/product-configuration/product-configuration.service";

function buildActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    tenantId: "tenant-1",
    tenantCode: "acme",
    username: "admin",
    displayName: "租户管理员",
    roleCodes: ["tenant-admin"],
    permissions: ["product-config:read", "product-config:write"],
    ...overrides
  } as any;
}

describe("ProductConfigurationService", () => {
  const repository = {
    ensureConfigs: vi.fn(),
    findTenantContext: vi.fn(),
    listConfigsForResolution: vi.fn(),
    upsertTenantOverride: vi.fn()
  };
  const auditLogsService = {
    create: vi.fn().mockResolvedValue(undefined)
  };
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findTenantContext.mockResolvedValue({
      id: "tenant-1",
      code: "acme",
      name: "Acme",
      industry: "制造业"
    });
  });

  it("resolves configuration entries with platform default, industry template and tenant override precedence", async () => {
    const service = new ProductConfigurationService(
      repository as any,
      auditLogsService as any,
      new RuntimeCacheService() as any
    );
    repository.listConfigsForResolution.mockResolvedValue([
      {
        id: "cfg-default",
        code: "PLATFORM_DEFAULT:THEME:brand-kit:global:global",
        tenantId: null,
        industryCode: null,
        layer: ProductConfigLayer.PLATFORM_DEFAULT,
        scope: ProductConfigScope.THEME,
        configKey: "brand-kit",
        displayName: "品牌主题",
        description: null,
        value: {
          brandName: "Business Backoffice",
          primaryColor: "#2563eb"
        },
        createdAt: new Date("2026-04-18T08:00:00.000Z"),
        updatedAt: new Date("2026-04-18T08:00:00.000Z")
      },
      {
        id: "cfg-industry",
        code: "INDUSTRY_TEMPLATE:THEME:brand-kit:global:制造业",
        tenantId: null,
        industryCode: "制造业",
        layer: ProductConfigLayer.INDUSTRY_TEMPLATE,
        scope: ProductConfigScope.THEME,
        configKey: "brand-kit",
        displayName: "制造业主题",
        description: null,
        value: {
          brandName: "Manufacturing Console",
          primaryColor: "#0f766e"
        },
        createdAt: new Date("2026-04-18T08:10:00.000Z"),
        updatedAt: new Date("2026-04-18T08:10:00.000Z")
      },
      {
        id: "cfg-tenant",
        code: "TENANT_OVERRIDE:THEME:brand-kit:tenant-1:global",
        tenantId: "tenant-1",
        industryCode: null,
        layer: ProductConfigLayer.TENANT_OVERRIDE,
        scope: ProductConfigScope.THEME,
        configKey: "brand-kit",
        displayName: "Acme 主题",
        description: null,
        value: {
          brandName: "Acme Workspace",
          primaryColor: "#7c3aed"
        },
        createdAt: new Date("2026-04-18T08:20:00.000Z"),
        updatedAt: new Date("2026-04-18T08:20:00.000Z")
      }
    ]);

    const result = await service.listResolvedEntries(buildActor());

    expect(result).toEqual([
      expect.objectContaining({
        scope: ProductConfigScope.THEME,
        configKey: "brand-kit",
        effectiveSource: ProductConfigLayer.TENANT_OVERRIDE,
        effectiveValue: {
          brandName: "Acme Workspace",
          primaryColor: "#7c3aed"
        },
        platformDefaultValue: {
          brandName: "Business Backoffice",
          primaryColor: "#2563eb"
        },
        industryTemplateValue: {
          brandName: "Manufacturing Console",
          primaryColor: "#0f766e"
        },
        tenantOverrideValue: {
          brandName: "Acme Workspace",
          primaryColor: "#7c3aed"
        }
      })
    ]);
  });

  it("derives runtime menu visibility and theme variables from resolved entries", async () => {
    const service = new ProductConfigurationService(
      repository as any,
      auditLogsService as any,
      new RuntimeCacheService() as any
    );
    repository.listConfigsForResolution.mockResolvedValue([
      {
        id: "menu-1",
        code: "default-menu",
        tenantId: null,
        industryCode: null,
        layer: ProductConfigLayer.PLATFORM_DEFAULT,
        scope: ProductConfigScope.MENU,
        configKey: "platform-workfeed",
        displayName: "统一待办入口",
        description: null,
        value: {
          visible: false,
          label: "协同总线"
        },
        createdAt: new Date("2026-04-18T08:00:00.000Z"),
        updatedAt: new Date("2026-04-18T08:00:00.000Z")
      },
      {
        id: "theme-1",
        code: "default-theme",
        tenantId: null,
        industryCode: null,
        layer: ProductConfigLayer.PLATFORM_DEFAULT,
        scope: ProductConfigScope.THEME,
        configKey: "brand-kit",
        displayName: "品牌主题",
        description: null,
        value: {
          brandName: "Acme Workspace",
          primaryColor: "#0f766e",
          accentColor: "#134e4a",
          surfaceTint: "#ecfeff",
          navigationMode: "compact"
        },
        createdAt: new Date("2026-04-18T08:00:00.000Z"),
        updatedAt: new Date("2026-04-18T08:00:00.000Z")
      }
    ]);

    const result = await service.getRuntimeConfig(buildActor());

    expect(result).toEqual({
      brandName: "Acme Workspace",
      primaryColor: "#0f766e",
      accentColor: "#134e4a",
      surfaceTint: "#ecfeff",
      navigationMode: "compact",
      hiddenNavigationKeys: ["platform-workfeed"],
      navigationLabels: {
        "platform-workfeed": "协同总线"
      }
    });
  });

  it("caches runtime and resolved entries until a tenant override invalidates them", async () => {
    const service = new ProductConfigurationService(
      repository as any,
      auditLogsService as any,
      new RuntimeCacheService() as any
    );
    repository.listConfigsForResolution.mockResolvedValue([
      {
        id: "theme-1",
        code: "default-theme",
        tenantId: null,
        industryCode: null,
        layer: ProductConfigLayer.PLATFORM_DEFAULT,
        scope: ProductConfigScope.THEME,
        configKey: "brand-kit",
        displayName: "品牌主题",
        description: null,
        value: {
          brandName: "Acme Workspace",
          primaryColor: "#0f766e"
        },
        createdAt: new Date("2026-04-18T08:00:00.000Z"),
        updatedAt: new Date("2026-04-18T08:00:00.000Z")
      }
    ]);
    repository.upsertTenantOverride.mockResolvedValue(undefined);

    await service.getRuntimeConfig(buildActor());
    await service.getRuntimeConfig(buildActor());
    await service.listResolvedEntries(buildActor());
    await service.listResolvedEntries(buildActor());

    expect(repository.listConfigsForResolution).toHaveBeenCalledTimes(2);

    await service.upsertTenantOverride(
      ProductConfigScope.THEME,
      "brand-kit",
      {
        value: {
          brandName: "Acme New"
        }
      },
      buildActor()
    );
    await service.getRuntimeConfig(buildActor());

    expect(repository.listConfigsForResolution).toHaveBeenCalledTimes(5);
  });
});
