import { http } from "@/api/http";
import type {
  ProductConfigEntry,
  ProductRuntimeConfig,
  ProductConfigScope,
  UpsertProductConfigOverridePayload
} from "@/types/product-configuration";

export async function fetchRuntimeProductConfig(): Promise<ProductRuntimeConfig> {
  const { data } = await http.get<ProductRuntimeConfig>("/product-configuration/runtime");
  return data;
}

export async function fetchProductConfigEntries(): Promise<ProductConfigEntry[]> {
  const { data } = await http.get<ProductConfigEntry[]>("/product-configuration/entries");
  return data;
}

export async function upsertProductConfigOverride(
  scope: ProductConfigScope,
  configKey: string,
  payload: UpsertProductConfigOverridePayload
): Promise<void> {
  await http.patch(`/product-configuration/entries/${scope}/${configKey}`, payload);
}
