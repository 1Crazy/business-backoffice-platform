import { ProductConfigLayer, ProductConfigScope } from "@prisma/client";

import { toIsoString } from "@/common/mappers/date-time.mapper";
import type { ProductConfigRecord } from "../repositories/product-configuration.repository";

export function mapResolvedConfigEntry(input: {
  scope: ProductConfigScope;
  configKey: string;
  displayName: string;
  description?: string | null;
  effectiveSource: ProductConfigLayer;
  effectiveValue: Record<string, unknown>;
  platformDefault?: ProductConfigRecord;
  industryTemplate?: ProductConfigRecord;
  tenantOverride?: ProductConfigRecord;
}) {
  return {
    scope: input.scope,
    configKey: input.configKey,
    displayName: input.displayName,
    description: input.description ?? null,
    effectiveSource: input.effectiveSource,
    effectiveValue: input.effectiveValue,
    platformDefaultValue: readJsonObject(input.platformDefault?.value),
    industryTemplateValue: readJsonObject(input.industryTemplate?.value),
    tenantOverrideValue: readJsonObject(input.tenantOverride?.value),
    sources: {
      platformDefault: input.platformDefault
        ? {
            displayName: input.platformDefault.displayName,
            description: input.platformDefault.description ?? null,
            updatedAt: toIsoString(input.platformDefault.updatedAt)!
          }
        : null,
      industryTemplate: input.industryTemplate
        ? {
            displayName: input.industryTemplate.displayName,
            description: input.industryTemplate.description ?? null,
            updatedAt: toIsoString(input.industryTemplate.updatedAt)!
          }
        : null,
      tenantOverride: input.tenantOverride
        ? {
            displayName: input.tenantOverride.displayName,
            description: input.tenantOverride.description ?? null,
            updatedAt: toIsoString(input.tenantOverride.updatedAt)!
          }
        : null
    }
  };
}

export function mapRuntimeConfig(input: {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  surfaceTint: string;
  navigationMode: string;
  hiddenNavigationKeys: string[];
  navigationLabels: Record<string, string>;
}) {
  return input;
}

function readJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
