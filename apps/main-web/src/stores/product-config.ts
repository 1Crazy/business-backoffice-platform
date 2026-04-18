import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { fetchRuntimeProductConfig } from "@/api/product-configuration.api";
import type { ProductRuntimeConfig } from "@/types/product-configuration";

export const useProductConfigStore = defineStore("product-config", () => {
  const runtimeConfig = ref<ProductRuntimeConfig | null>(null);
  const isLoaded = ref(false);

  const hiddenNavigationKeys = computed(() => runtimeConfig.value?.hiddenNavigationKeys ?? []);
  const navigationLabels = computed(() => runtimeConfig.value?.navigationLabels ?? {});
  const themeVars = computed<Record<string, string>>(() => ({
    "--tenant-primary": runtimeConfig.value?.primaryColor ?? "#2563eb",
    "--tenant-accent": runtimeConfig.value?.accentColor ?? "#0f172a",
    "--tenant-surface": runtimeConfig.value?.surfaceTint ?? "#eff6ff"
  }));

  async function loadRuntimeConfig(force = false): Promise<void> {
    if (isLoaded.value && !force) {
      return;
    }

    runtimeConfig.value = await fetchRuntimeProductConfig();
    isLoaded.value = true;
  }

  function reset(): void {
    runtimeConfig.value = null;
    isLoaded.value = false;
  }

  return {
    runtimeConfig,
    isLoaded,
    hiddenNavigationKeys,
    navigationLabels,
    themeVars,
    loadRuntimeConfig,
    reset
  };
});
