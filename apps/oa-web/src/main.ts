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

const OA_ROOT_CLASS = "oa-app-root";
const OA_OVERLAY_SCOPE_CLASS = "oa-overlay-scope";
const OA_STANDALONE_ATTR = "data-oa-standalone";
const OA_OVERLAY_SELECTORS = [
  ".el-overlay",
  ".el-popper",
  ".el-picker-panel",
  ".el-select-dropdown",
  ".el-message",
  ".el-notification"
].join(", ");

let app: VueApp<Element> | null = null;
let mountElement: HTMLElement | null = null;
let overlayScopeObserver: MutationObserver | null = null;

function applyOverlayScope(target: ParentNode): void {
  if (typeof Element === "undefined") {
    return;
  }

  if (target instanceof Element && target.matches(OA_OVERLAY_SELECTORS)) {
    target.classList.add(OA_OVERLAY_SCOPE_CLASS);
  }

  target.querySelectorAll(OA_OVERLAY_SELECTORS).forEach((element) => {
    element.classList.add(OA_OVERLAY_SCOPE_CLASS);
  });
}

function startOverlayScopeObserver(): void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return;
  }

  overlayScopeObserver?.disconnect();
  overlayScopeObserver = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          applyOverlayScope(node);
        }
      });
    }
  });
  overlayScopeObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function stopOverlayScopeObserver(): void {
  overlayScopeObserver?.disconnect();
  overlayScopeObserver = null;

  if (typeof document === "undefined") {
    return;
  }

  document.querySelectorAll(`.${OA_OVERLAY_SCOPE_CLASS}`).forEach((element) => {
    element.classList.remove(OA_OVERLAY_SCOPE_CLASS);
  });
}

function syncStandaloneDocumentState(standalone: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const body = document.body;

  if (standalone) {
    root.setAttribute(OA_STANDALONE_ATTR, "true");
    body.setAttribute(OA_STANDALONE_ATTR, "true");
    return;
  }

  root.removeAttribute(OA_STANDALONE_ATTR);
  body.removeAttribute(OA_STANDALONE_ATTR);
}

function render(container?: Element | Document, standalone = false): void {
  const mountTarget = (container ?? document).querySelector("#app");

  if (!(mountTarget instanceof HTMLElement)) {
    return;
  }

  syncStandaloneDocumentState(standalone);
  mountTarget.classList.add(OA_ROOT_CLASS);
  mountElement = mountTarget;
  startOverlayScopeObserver();

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
    mountElement?.classList.remove(OA_ROOT_CLASS);
    mountElement = null;
    stopOverlayScopeObserver();
    syncStandaloneDocumentState(false);
    return Promise.resolve();
  }
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render(undefined, true);
}
