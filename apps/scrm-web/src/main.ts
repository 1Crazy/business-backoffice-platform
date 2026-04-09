/** 前端入口：负责挂载应用、路由和全局样式。 */
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createApp, type App as VueApp } from "vue";
import { qiankunWindow, renderWithQiankun } from "vite-plugin-qiankun/dist/helper";

import App from "@/App.vue";
import { elementPlusOptions } from "@/plugins/element-plus";
import { router } from "@/router";
import "./styles/global.css";

const SCRM_ROOT_CLASS = "scrm-app-root";
const SCRM_STANDALONE_ATTR = "data-scrm-standalone";

let app: VueApp<Element> | null = null;
let mountElement: HTMLElement | null = null;

function syncStandaloneDocumentState(standalone: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const body = document.body;

  if (standalone) {
    root.setAttribute(SCRM_STANDALONE_ATTR, "true");
    body.setAttribute(SCRM_STANDALONE_ATTR, "true");
    return;
  }

  root.removeAttribute(SCRM_STANDALONE_ATTR);
  body.removeAttribute(SCRM_STANDALONE_ATTR);
}

function render(container?: Element | Document, standalone = false): void {
  const mountTarget = (container ?? document).querySelector("#app");

  if (!(mountTarget instanceof HTMLElement)) {
    return;
  }

  syncStandaloneDocumentState(standalone);
  mountTarget.classList.add(SCRM_ROOT_CLASS);
  mountElement = mountTarget;

  app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(ElementPlus, elementPlusOptions);
  app.mount(mountTarget);
}

renderWithQiankun({
  bootstrap() {
    return Promise.resolve();
  },
  mount(props) {
    render(props.container, false);
    return Promise.resolve();
  },
  update() {
    return Promise.resolve();
  },
  unmount() {
    app?.unmount();
    app = null;
    mountElement?.classList.remove(SCRM_ROOT_CLASS);
    mountElement = null;
    syncStandaloneDocumentState(false);
    return Promise.resolve();
  }
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render(undefined, true);
}
