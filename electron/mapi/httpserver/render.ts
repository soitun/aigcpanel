import { ipcRenderer } from "electron";

const status = async (): Promise<{ running: boolean; port: number }> => {
    return ipcRenderer.invoke("httpserver:status");
};

const start = async (
    port?: number,
): Promise<{ code: number; msg?: string }> => {
    return ipcRenderer.invoke("httpserver:start", port);
};

const stop = async (): Promise<{ code: number }> => {
    return ipcRenderer.invoke("httpserver:stop");
};

const getPort = async (): Promise<number> => {
    return ipcRenderer.invoke("httpserver:getPort");
};

const setPort = async (port: number): Promise<{ code: number }> => {
    return ipcRenderer.invoke("httpserver:setPort", port);
};

const getEnabled = async (): Promise<boolean> => {
    return ipcRenderer.invoke("httpserver:getEnabled");
};

const setEnabled = async (enabled: boolean): Promise<{ code: number }> => {
    return ipcRenderer.invoke("httpserver:setEnabled", enabled);
};

export default {
    status,
    start,
    stop,
    getPort,
    setPort,
    getEnabled,
    setEnabled,
};
