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
