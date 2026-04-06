/** 前端入口：负责挂载应用、路由和全局样式。 */
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createApp } from "vue";

import App from "@/App.vue";
import { elementPlusOptions } from "@/plugins/element-plus";
import { router } from "@/router";
import "./styles/global.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, elementPlusOptions);

app.mount("#app");
