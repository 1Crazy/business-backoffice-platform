import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";

import {
  fetchProductConfigEntries,
  upsertProductConfigOverride
} from "@/api/product-configuration.api";
import { useProductConfigStore } from "@/stores/product-config";
import type {
  ProductConfigEntry,
  ProductConfigLayer,
  ProductConfigOverrideFormModel,
  ProductConfigScope,
  UpsertProductConfigOverridePayload
} from "@/types/product-configuration";
import { normalizeOptionalTextForCreate, normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const scopeOrder: ProductConfigScope[] = ["MENU", "FIELD_SCHEME", "FORM_TEMPLATE", "THEME", "TEMPLATE"];

export function useProductConfigurationPage() {
  const productConfigStore = useProductConfigStore();
  const entries = ref<ProductConfigEntry[]>([]);
  const isLoading = ref(true);
  const isSubmitting = ref(false);
  const activeScope = ref<ProductConfigScope>("MENU");
  const activeConfigKey = ref("");
  const editDialogVisible = ref(false);
  const formRef = ref<FormInstance>();

  const overrideForm = reactive<ProductConfigOverrideFormModel>({
    scope: "MENU",
    configKey: "",
    displayName: "",
    description: "",
    visible: true,
    label: "",
    required: false,
    title: "",
    layout: "two-column",
    requiredFieldsText: "",
    brandName: "",
    primaryColor: "#2563eb",
    accentColor: "#0f172a",
    surfaceTint: "#eff6ff",
    navigationMode: "compact",
    summary: "",
    ctaLabel: ""
  });

  const rules: FormRules<ProductConfigOverrideFormModel> = {
    displayName: [{ required: true, message: "请输入配置名称", trigger: "blur" }]
  };

  const visibleEntries = computed(() => entries.value.filter((item) => item.scope === activeScope.value));
  const selectedEntry = computed(
    () => visibleEntries.value.find((item) => item.configKey === activeConfigKey.value) ?? visibleEntries.value[0] ?? null
  );
  const summaryItems = computed(() => [
    {
      label: "配置项总数",
      value: entries.value.length
    },
    {
      label: "租户覆盖",
      value: entries.value.filter((item) => item.effectiveSource === "TENANT_OVERRIDE").length
    },
    {
      label: "行业模板继承",
      value: entries.value.filter((item) => item.effectiveSource === "INDUSTRY_TEMPLATE").length
    },
    {
      label: "平台默认继承",
      value: entries.value.filter((item) => item.effectiveSource === "PLATFORM_DEFAULT").length
    }
  ]);

  function setFormRef(instance: FormInstance | undefined): void {
    formRef.value = instance;
  }

  async function loadEntries(): Promise<void> {
    isLoading.value = true;

    try {
      entries.value = await fetchProductConfigEntries();
      activeConfigKey.value = selectedEntry.value?.configKey ?? entries.value[0]?.configKey ?? "";
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "产品配置数据加载失败，请稍后重试。"));
    } finally {
      isLoading.value = false;
    }
  }

  function selectScope(scope: ProductConfigScope): void {
    activeScope.value = scope;
    activeConfigKey.value = visibleEntries.value[0]?.configKey ?? "";
  }

  function selectEntry(entry: ProductConfigEntry): void {
    activeScope.value = entry.scope;
    activeConfigKey.value = entry.configKey;
  }

  async function openEditDialog(entry: ProductConfigEntry): Promise<void> {
    const value = entry.tenantOverrideValue ?? entry.effectiveValue;
    overrideForm.scope = entry.scope;
    overrideForm.configKey = entry.configKey;
    overrideForm.displayName = entry.displayName;
    overrideForm.description = entry.description ?? "";
    overrideForm.visible = value.visible !== false;
    overrideForm.label = readString(value.label) ?? "";
    overrideForm.required = value.required === true;
    overrideForm.title = readString(value.title) ?? "";
    overrideForm.layout = readString(value.layout) ?? "two-column";
    overrideForm.requiredFieldsText = Array.isArray(value.requiredFields) ? value.requiredFields.join(", ") : "";
    overrideForm.brandName = readString(value.brandName) ?? "";
    overrideForm.primaryColor = readString(value.primaryColor) ?? "#2563eb";
    overrideForm.accentColor = readString(value.accentColor) ?? "#0f172a";
    overrideForm.surfaceTint = readString(value.surfaceTint) ?? "#eff6ff";
    overrideForm.navigationMode = readString(value.navigationMode) ?? "compact";
    overrideForm.summary = readString(value.summary) ?? "";
    overrideForm.ctaLabel = readString(value.ctaLabel) ?? "";
    editDialogVisible.value = true;
  }

  function buildPayload(): UpsertProductConfigOverridePayload {
    const base = {
      displayName: normalizeRequiredText(overrideForm.displayName),
      description: normalizeOptionalTextForCreate(overrideForm.description)
    };

    if (overrideForm.scope === "MENU") {
      return {
        ...base,
        value: {
          visible: overrideForm.visible,
          label: normalizeRequiredText(overrideForm.label)
        }
      };
    }

    if (overrideForm.scope === "FIELD_SCHEME") {
      return {
        ...base,
        value: {
          visible: overrideForm.visible,
          label: normalizeRequiredText(overrideForm.label),
          required: overrideForm.required
        }
      };
    }

    if (overrideForm.scope === "FORM_TEMPLATE") {
      return {
        ...base,
        value: {
          title: normalizeRequiredText(overrideForm.title),
          layout: normalizeRequiredText(overrideForm.layout),
          requiredFields: overrideForm.requiredFieldsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        }
      };
    }

    if (overrideForm.scope === "THEME") {
      return {
        ...base,
        value: {
          brandName: normalizeRequiredText(overrideForm.brandName),
          primaryColor: normalizeRequiredText(overrideForm.primaryColor),
          accentColor: normalizeRequiredText(overrideForm.accentColor),
          surfaceTint: normalizeRequiredText(overrideForm.surfaceTint),
          navigationMode: normalizeRequiredText(overrideForm.navigationMode)
        }
      };
    }

    return {
      ...base,
      value: {
        title: normalizeRequiredText(overrideForm.title),
        summary: normalizeRequiredText(overrideForm.summary),
        ctaLabel: normalizeRequiredText(overrideForm.ctaLabel)
      }
    };
  }

  async function submitOverride(): Promise<void> {
    const isValid = await validateForm(formRef.value);

    if (!isValid) {
      return;
    }

    isSubmitting.value = true;

    try {
      await upsertProductConfigOverride(overrideForm.scope, overrideForm.configKey, buildPayload());
      await Promise.all([loadEntries(), productConfigStore.loadRuntimeConfig(true)]);
      editDialogVisible.value = false;
      ElMessage.success("租户覆盖配置已更新。");
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "配置更新失败，请稍后重试。"));
    } finally {
      isSubmitting.value = false;
    }
  }

  onMounted(() => {
    void loadEntries();
  });

  return {
    activeScope,
    editDialogVisible,
    entries,
    isLoading,
    isSubmitting,
    openEditDialog,
    overrideForm,
    rules,
    scopeOrder,
    selectedEntry,
    selectEntry,
    selectScope,
    setFormRef,
    submitOverride,
    summaryItems,
    visibleEntries
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
