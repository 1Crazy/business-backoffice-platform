export type ProductConfigScope = "MENU" | "FIELD_SCHEME" | "FORM_TEMPLATE" | "THEME" | "TEMPLATE";
export type ProductConfigLayer = "PLATFORM_DEFAULT" | "INDUSTRY_TEMPLATE" | "TENANT_OVERRIDE";

export interface ProductRuntimeConfig {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  surfaceTint: string;
  navigationMode: string;
  hiddenNavigationKeys: string[];
  navigationLabels: Record<string, string>;
}

export interface ProductConfigEntry {
  scope: ProductConfigScope;
  configKey: string;
  displayName: string;
  description?: string | null;
  effectiveSource: ProductConfigLayer;
  effectiveValue: Record<string, unknown>;
  platformDefaultValue?: Record<string, unknown> | null;
  industryTemplateValue?: Record<string, unknown> | null;
  tenantOverrideValue?: Record<string, unknown> | null;
  sources: {
    platformDefault?: ProductConfigSourceMeta | null;
    industryTemplate?: ProductConfigSourceMeta | null;
    tenantOverride?: ProductConfigSourceMeta | null;
  };
}

export interface ProductConfigSourceMeta {
  displayName: string;
  description?: string | null;
  updatedAt: string;
}

export interface UpsertProductConfigOverridePayload {
  displayName?: string;
  description?: string;
  value: Record<string, unknown>;
}

export interface ProductConfigOverrideFormModel {
  scope: ProductConfigScope;
  configKey: string;
  displayName: string;
  description: string;
  visible: boolean;
  label: string;
  required: boolean;
  title: string;
  layout: string;
  requiredFieldsText: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  surfaceTint: string;
  navigationMode: string;
  summary: string;
  ctaLabel: string;
}
