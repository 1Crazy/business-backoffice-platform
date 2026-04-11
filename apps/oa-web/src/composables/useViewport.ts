/** 场景 composable：负责根据视口宽度提供抽屉等交互所需的响应式断点状态。 */
import { computed, onMounted, onUnmounted, ref } from "vue";

export function useViewport() {
  const width = ref(typeof window === "undefined" ? 1440 : window.innerWidth);

  function syncWidth(): void {
    width.value = window.innerWidth;
  }

  onMounted(() => {
    syncWidth();
    window.addEventListener("resize", syncWidth);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", syncWidth);
  });

  return {
    width,
    isDesktop: computed(() => width.value >= 1280),
    isTabletOrDown: computed(() => width.value < 1025)
  };
}
