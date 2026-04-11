/** 前端入口：负责挂载主应用、全局样式、路由和 qiankun 宿主运行时。 */
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createApp } from "vue";

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
  // 等宿主路由准备好后再启动 qiankun，避免首次直达子应用页面时容器尚未渲染完成。
  initializeMicroApps();
});
