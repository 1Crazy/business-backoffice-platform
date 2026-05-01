/** 前端入口：负责挂载主应用、全局样式、路由和 qiankun 宿主运行时。 */
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createApp, nextTick } from "vue";

import App from "@/App.vue";
import { initializeMicroApps } from "@/micro/runtime";
import { elementPlusOptions } from "@/plugins/element-plus";
import { router } from "@/router";
import "./styles/global.css";

const MAIN_NATIVE_ATTR = "data-main-native-shell";

function syncMainNativeDocumentState(): void {
  if (typeof document === "undefined") {
    return;
  }

  const isNativeRoute = !router.currentRoute.value.meta.microAppName;

  if (isNativeRoute) {
    document.body.setAttribute(MAIN_NATIVE_ATTR, "true");
    return;
  }

  document.body.removeAttribute(MAIN_NATIVE_ATTR);
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, elementPlusOptions);
app.mount("#app");
syncMainNativeDocumentState();

router.afterEach(() => {
  syncMainNativeDocumentState();
});

void router.isReady().then(() => {
  syncMainNativeDocumentState();
  // 等宿主路由和 RouterView 完成首屏渲染后再启动 qiankun，避免直达子应用时容器尚未挂载。
  void nextTick(() => {
    initializeMicroApps();
  });
});
