/** 导航组装逻辑：集中处理主应用当前页面信息与可见菜单过滤，避免布局组件过度膨胀。 */
import { computed } from "vue";
import { useRoute } from "vue-router";

import { findNavigationItemByPath, getVisibleNavigationGroups } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth";
import { useProductConfigStore } from "@/stores/product-config";
import type { HostDomain } from "@/types/navigation";

export function useHostNavigation() {
  const route = useRoute();
  const authStore = useAuthStore();
  const productConfigStore = useProductConfigStore();

  const visibleGroups = computed(() =>
    getVisibleNavigationGroups(authStore.currentUser?.permissions ?? [])
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => !productConfigStore.hiddenNavigationKeys.includes(item.key))
          .map((item) => ({
            ...item,
            title: productConfigStore.navigationLabels[item.key] ?? item.title
          }))
      }))
      .filter((group) => group.items.length > 0)
  );
  const currentItem = computed(() => findNavigationItemByPath(route.path));
  const currentTitle = computed(() => route.meta.title?.toString() ?? currentItem.value?.title ?? "主应用工作台");
  const currentDescription = computed(
    () => route.meta.description?.toString() ?? currentItem.value?.description ?? "统一承载平台治理、OA 与 SCRM 页面内容。"
  );
  const currentKicker = computed(() => route.meta.kicker?.toString() ?? currentItem.value?.kicker ?? "统一门户");
  const currentSectionLabel = computed(
    () => route.meta.sectionLabel?.toString() ?? currentItem.value?.sectionLabel ?? "统一导航"
  );
  const currentDomainBadge = computed(
    () => route.meta.domainBadge?.toString() ?? currentItem.value?.domainBadge ?? "平台"
  );
  const currentDomainTitle = computed(
    () => route.meta.domainTitle?.toString() ?? currentItem.value?.domainTitle ?? "统一门户"
  );
  const currentDomain = computed<HostDomain>(() => currentItem.value?.domain ?? "platform");

  return {
    visibleGroups,
    currentItem,
    currentDomain,
    currentTitle,
    currentDescription,
    currentKicker,
    currentSectionLabel,
    currentDomainBadge,
    currentDomainTitle
  };
}
