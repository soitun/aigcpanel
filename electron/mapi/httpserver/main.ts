import http from "node:http";
import {ipcMain, net} from "electron";
import {Log} from "../log/main";
import ConfigMain from "../config/main";
import StorageMain from "../storage/main";
import User from "../user/main";

type TaskRecord = {
    status: "pending" | "success" | "error";
    result?: string;
    error?: string;
};

const tasks = new Map<string, TaskRecord>();
let server: http.Server | null = null;
let isRunning = false;
let runningPort = 0;

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

const sendJson = (res: http.ServerResponse, statusCode: number, data: any) => {
    res.writeHead(statusCode, {"Content-Type": "application/json"});
    res.end(JSON.stringify(data));
};

const getEnabledModels = async () => {
    const storageData = await StorageMain.read("models", null);
    const userData = await User.get();
    const models: {id: string; providerId: string; modelId: string; modelName: string}[] = [];

    if (!storageData || !storageData.providerData) return models;

    for (const providerId in storageData.providerData) {
        const providerData = storageData.providerData[providerId];
        if (!providerData.enabled) continue;

        for (const model of providerData.models || []) {
            if (!model.enabled) continue;
            models.push({
                id: `${providerId}|${model.id}`,
                providerId,
                modelId: model.id,
                modelName: model.name,
            });
        }
    }

    // buildIn provider from user lmApi
    if (userData?.data && (userData.data as any).lmApi) {
        const lmApi = (userData.data as any).lmApi;
        const buildInData = storageData?.providerData?.["buildIn"];
        const enabled = buildInData ? buildInData.enabled !== false : true;
        if (enabled && lmApi.models) {
            const existing = models.filter(m => m.providerId === "buildIn").map(m => m.modelId);
            for (const m of lmApi.models) {
                if (!existing.includes(m)) {
                    models.push({
                        id: `buildIn|${m}`,
                        providerId: "buildIn",
                        modelId: m,
                        modelName: m,
                    });
                }
            }
        }
    }

    return models;
};

const callModel = async (
    providerId: string,
    modelId: string,
    prompt: string,
    systemPrompt?: string
): Promise<string> => {
    const storageData = await StorageMain.read("models", null);
    const userData = await User.get();

    let apiKey = "";
    let apiUrl = "";
    let apiHost = "";

    if (providerId === "buildIn") {
        const lmApi = (userData?.data as any)?.lmApi;
        if (!lmApi) throw new Error("buildIn provider not configured");
        apiKey = lmApi.apiKey || "";
        apiUrl = lmApi.apiUrl || "";
    } else {
        const providerData = storageData?.providerData?.[providerId];
        if (!providerData) throw new Error(`Provider not found: ${providerId}`);
        apiKey = providerData.apiKey || "";
        apiUrl = providerData.apiUrl || "";
        apiHost = providerData.apiHost || "";
    }

    let url = apiHost || apiUrl;
    if (!url) throw new Error(`No API URL configured for provider: ${providerId}`);

    if (url.endsWith("/")) {
        url = `${url}chat/completions`;
    } else if (!url.endsWith("/chat/completions")) {
        url = `${url}/v1/chat/completions`;
    }

    const messages: any[] = [];
    if (systemPrompt) {
        messages.push({role: "system", content: systemPrompt});
    }
    messages.push({role: "user", content: prompt});

    const response = await net.fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({model: modelId, messages}),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API call failed: ${response.status}\n${error}`);
    }

    const data = (await response.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (content === undefined) {
        throw new Error(`Invalid response format: ${JSON.stringify(data)}`);
    }
    return content;
};

const handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse, port: number) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url!, `http://localhost:${port}`);

    if (req.method === "GET" && url.pathname === "/api/model/list") {
        const models = await getEnabledModels();
        sendJson(res, 200, {code: 0, data: models});
        return;
    }

    if (req.method === "POST" && url.pathname === "/api/model/call") {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });
        req.on("end", async () => {
            try {
                const {model, prompt, systemPrompt} = JSON.parse(body);
                const [providerId, modelId] = (model || "").split("|");
                if (!providerId || !modelId) {
                    sendJson(res, 400, {code: -1, msg: 'Invalid model format, expected "providerId|modelId"'});
                    return;
                }
                if (!prompt) {
                    sendJson(res, 400, {code: -1, msg: "Missing prompt"});
                    return;
                }
                const taskId = generateId();
                tasks.set(taskId, {status: "pending"});
                sendJson(res, 200, {code: 0, data: {taskId}});
                callModel(providerId, modelId, prompt, systemPrompt)
                    .then(result => {
                        tasks.set(taskId, {status: "success", result});
                    })
                    .catch(err => {
                        tasks.set(taskId, {status: "error", error: String(err)});
                    });
            } catch (e) {
                sendJson(res, 400, {code: -1, msg: `Invalid request: ${e}`});
            }
        });
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/model/query") {
        const taskId = url.searchParams.get("taskId");
        if (!taskId) {
            sendJson(res, 400, {code: -1, msg: "Missing taskId"});
            return;
        }
        const task = tasks.get(taskId);
        if (!task) {
            sendJson(res, 404, {code: -1, msg: "Task not found"});
            return;
        }
        sendJson(res, 200, {code: 0, data: task});
        return;
    }

    sendJson(res, 404, {code: -1, msg: "Not found"});
};

const start = async (port?: number): Promise<void> => {
    if (isRunning) {
        await stop();
    }
    if (!port) {
        port = await ConfigMain.get("httpServerPort", 60000);
    }
    return new Promise((resolve, reject) => {
        const s = http.createServer((req, res) => {
            handleRequest(req, res, port!).catch(err => {
                Log.error("httpserver.request.error", err);
                try {
                    sendJson(res, 500, {code: -1, msg: `Internal error: ${err}`});
                } catch (_) {}
            });
        });
        s.listen(port, "127.0.0.1", () => {
            server = s;
            isRunning = true;
            runningPort = port!;
            Log.info("httpserver.start", {port});
            resolve();
        });
        s.on("error", (err: any) => {
            Log.error("httpserver.error", err);
            reject(err);
        });
    });
};

const stop = async (): Promise<void> => {
    return new Promise(resolve => {
        if (!server) {
            isRunning = false;
            runningPort = 0;
            resolve();
            return;
        }
        server.close(() => {
            server = null;
            isRunning = false;
            runningPort = 0;
            resolve();
        });
    });
};

const status = () => ({
    running: isRunning,
    port: runningPort,
});

ipcMain.handle("httpserver:status", async () => {
    return status();
});

ipcMain.handle("httpserver:start", async (_, port?: number) => {
    try {
        await start(port);
        return {code: 0};
    } catch (e) {
        return {code: -1, msg: String(e)};
    }
});

ipcMain.handle("httpserver:stop", async () => {
    await stop();
    return {code: 0};
});

ipcMain.handle("httpserver:getPort", async () => {
    return await ConfigMain.get("httpServerPort", 60000);
});

ipcMain.handle("httpserver:setPort", async (_, port: number) => {
    await ConfigMain.set("httpServerPort", port);
    return {code: 0};
});

ipcMain.handle("httpserver:getEnabled", async () => {
    return await ConfigMain.get("httpServerEnabled", true);
});

ipcMain.handle("httpserver:setEnabled", async (_, enabled: boolean) => {
    await ConfigMain.set("httpServerEnabled", enabled);
    return {code: 0};
});

export const HttpServerMain = {
    start,
    stop,
    status,
};

export default HttpServerMain;
