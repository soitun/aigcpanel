import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import ArcoVue, { Message } from "@arco-design/web-vue";
import ArcoVueIcon from "@arco-design/web-vue/es/icon";
import "@arco-design/web-vue/dist/arco.css";

import { enUS, zhCN } from "date-fns/locale";
import timeago from "vue-timeago3";

import { i18n, t } from "./lang";

import "./style.less";
import { Dialog } from "./lib/dialog";

import { CommonComponents } from "./components/common";
import { TaskManager } from "./task";
import { useSettingStore } from "./store/modules/setting";

const settingStore = useSettingStore();

const app = createApp(App);
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.use(timeago, {
    converterOptions: {
        includeSeconds: false,
    },
    locale: zhCN,
});
app.use(CommonComponents);
app.use(i18n);
app.use(store);
app.use(router);
Message._context = app._context;
app.config.globalProperties.$mapi = window.$mapi;
app.config.globalProperties.$dialog = Dialog;
app.config.globalProperties.$t = t as any;
TaskManager.init();

app.mount("#app").$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*");

    window.__debug = {
        navigate: (route: string) => {
            const appEl = document.querySelector("#app");
            const vueApp = appEl && (appEl as any).__vue_app__;
            if (vueApp) vueApp.config.globalProperties.$router.push(route);
        },
        getHash: () => window.location.hash,
        click: (selector: string) => {
            const el = document.querySelector(selector) as HTMLElement | null;
            if (!el) throw new Error(`__debug.click: 未找到元素 "${selector}"`);
            el.click();
        },
        clickNth: (selector: string, index: number) => {
            const el = document.querySelectorAll(selector)[index] as
                | HTMLElement
                | undefined;
            if (!el)
                throw new Error(
                    `__debug.clickNth: 未找到第 ${index} 个 "${selector}"`,
                );
            el.click();
        },
        exists: (selector: string) => !!document.querySelector(selector),
        count: (selector: string) => document.querySelectorAll(selector).length,
        getText: (selector: string) =>
            document.querySelector(selector)?.textContent ?? null,
    };
});
