/** qiankun 宿主运行时：负责集中注册子应用、追踪加载态并收敛全局错误处理。 */
import { reactive } from "vue";
import { addGlobalUncaughtErrorHandler, registerMicroApps, start } from "qiankun";

import { microAppDefinitions } from "@/micro/apps";
import type { MicroAppName } from "@/types/navigation";

interface MicroRuntimeState {
  initialized: boolean;
  loadingAppName: MicroAppName | null;
  errors: Partial<Record<MicroAppName, { message: string; entry: string }>>;
}

const microRuntimeState = reactive<MicroRuntimeState>({
  initialized: false,
  loadingAppName: null,
  errors: {}
});

export function initializeMicroApps(): void {
  if (microRuntimeState.initialized) {
    return;
  }

  registerMicroApps(
    microAppDefinitions.map((definition) => ({
      name: definition.name,
      entry: definition.entry,
      container: "#micro-app-slot",
      activeRule: (location) => location.pathname.startsWith(definition.activeRule),
      loader(loading) {
        microRuntimeState.loadingAppName = loading ? definition.name : null;

        if (loading) {
          microRuntimeState.errors[definition.name] = undefined;
        }
      }
    })),
    {
      beforeLoad: [
        async (app) => {
          microRuntimeState.loadingAppName = app.name as MicroAppName;
          microRuntimeState.errors[app.name as MicroAppName] = undefined;
        }
      ],
      afterMount: [
        async (app) => {
          if (microRuntimeState.loadingAppName === app.name) {
            microRuntimeState.loadingAppName = null;
          }
        }
      ],
      afterUnmount: [
        async (app) => {
          if (microRuntimeState.loadingAppName === app.name) {
            microRuntimeState.loadingAppName = null;
          }
        }
      ]
    }
  );

  addGlobalUncaughtErrorHandler((event) => {
    const activeAppName = microRuntimeState.loadingAppName;
    const errorMessage =
      typeof event === "string"
        ? event
        : event instanceof ErrorEvent
          ? event.message
          : "子应用加载失败，请确认联调服务是否已经启动。";

    if (activeAppName) {
      const definition = microAppDefinitions.find((item) => item.name === activeAppName);
      microRuntimeState.errors[activeAppName] = {
        message: errorMessage,
        entry: definition?.entry ?? "unknown"
      };
      microRuntimeState.loadingAppName = null;
    }
  });

  // 这里先使用 qiankun 默认 sandbox。实验性样式隔离在当前 Vite 子应用组合下会触发白屏，
  // 先保证宿主链路稳定，再由后续独立 change 评估是否需要更强隔离策略。
  start({
    prefetch: false
  });

  microRuntimeState.initialized = true;
}

export function useMicroRuntimeState(): MicroRuntimeState {
  return microRuntimeState;
}
