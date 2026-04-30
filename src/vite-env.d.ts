/// <reference types="vite/client" />
import type { Dialog } from "./lib/dialog";
import type { Router } from "vue-router";

declare global {
    interface Window {
        __debug?: {
            /** 通过 Vue Router 导航到指定路由 */
            navigate: (route: string) => void;
            /** 获取当前 location.hash */
            getHash: () => string;
            /** 点击第一个匹配的元素 */
            click: (selector: string) => void;
            /** 点击第 index 个匹配的元素（0-based） */
            clickNth: (selector: string, index: number) => void;
            /** 元素是否存在 */
            exists: (selector: string) => boolean;
            /** 匹配元素数量 */
            count: (selector: string) => number;
            /** 获取元素 textContent */
            getText: (selector: string) => string | null;
        };
    }
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $router: Router;
        $dialog: Dialog;
        $t: typeof import("vue-i18n").GlobalTranslate;
    }
}
