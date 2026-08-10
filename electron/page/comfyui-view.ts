import { BrowserWindow } from "electron";
import { t } from "../config/lang";
import { DevToolsManager } from "../lib/devtools";
import { AppRuntime } from "../mapi/env";

/**
 * 打开 ComfyUI Web UI 查看窗口（BrowserWindow）
 * 仅在服务已启动（端口有效）时可用；单例模式，重复打开时聚焦已有窗口
 */
export const PageComfyUIView = {
    NAME: "comfyui-view",
    open: async (option: {
        title?: string;
        url?: string;
        width?: number;
        height?: number;
    }) => {
        option = Object.assign(
            {
                title: t("model.comfyuiView") || "ComfyUI",
                width: 1280,
                height: 800,
                url: "",
            },
            option,
        );
        // 单例：已存在则聚焦
        const existing = AppRuntime.windows[PageComfyUIView.NAME];
        if (existing && !existing.isDestroyed()) {
            existing.show();
            existing.focus();
            if (option.url) {
                existing.loadURL(option.url).catch(() => {});
            }
            return existing;
        }
        const win = new BrowserWindow({
            title: option.title,
            width: option.width,
            height: option.height,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false,
                webviewTag: true,
            },
            show: true,
            frame: true,
            center: true,
            transparent: false,
            focusable: true,
            alwaysOnTop: false,
        });
        win.on("close", () => {
            delete AppRuntime.windows[PageComfyUIView.NAME];
        });
        AppRuntime.windows[PageComfyUIView.NAME] = win;
        if (option.url) {
            await win.loadURL(option.url).catch((e) => {
                console.log("comfyui-view.loadURL.error", e);
            });
        }
        win.show();
        win.focus();
        DevToolsManager.register(`Page.${PageComfyUIView.NAME}`, win);
        return win;
    },
};
