import express from "express";
import type { Request, Response } from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ipcMain } from "electron";
import { Log } from "../log/main";
import ConfigMain from "../config/main";
import StorageMain from "../storage/main";
import { Events } from "../event/main";
import { DBMain } from "../db/main";
import { AppEnv } from "../env";
import docHtml from "./doc.html?raw";

let server: http.Server | null = null;
let isRunning = false;
let runningPort = 0;
let runningToken = "";

const getAvailablePort = (): Promise<number> => {
    return new Promise((resolve, reject) => {
        const s = http.createServer();
        s.listen(0, "127.0.0.1", () => {
            const addr = s.address() as { port: number };
            const port = addr.port;
            s.close(() => resolve(port));
        });
        s.on("error", reject);
    });
};

const generateToken = (): string => {
    return (
        crypto.randomUUID().replace(/-/g, "") +
        crypto.randomUUID().replace(/-/g, "")
    );
};

const writeCliAuthFile = (port: number, token: string): void => {
    try {
        const filePath = path.join(AppEnv.userData, "cli-auth.json");
        fs.writeFileSync(filePath, JSON.stringify({ port, token }), "utf-8");
    } catch (e) {
        Log.error("httpserver.writeCliAuthFile.error", e);
    }
};

const functionArgsMap: Record<string, string[]> = {
    soundTts: ["text"],
    soundClone: ["text", "promptAudio", "promptText"],
    videoGen: ["video", "audio"],
    asr: ["audio"],
    textToImage: ["prompt"],
    imageToImage: ["image", "prompt"],
    live: [],
};

const functionBizMap: Record<string, string> = {
    soundTts: "SoundGenerate",
    soundClone: "SoundGenerate",
    videoGen: "VideoGen",
    asr: "SoundAsr",
    textToImage: "TextToImage",
    imageToImage: "ImageToImage",
};

const getInstalledServers = async () => {
    const storageData = await StorageMain.read("server", null);
    const records = storageData?.records || [];
    return records
        .filter((r: any) => r.name && r.version)
        .map((r: any) => ({
            id: `${r.name}|${r.version}`,
            name: r.name,
            version: r.version,
            title: r.title || r.name,
            functions: (r.functions || []).map((funcName: string) => ({
                name: funcName,
                args: functionArgsMap[funcName] || [],
                param: r.config?.functions?.[funcName]?.param || [],
            })),
        }));
};

const getServerRecord = async (serverName: string, serverVersion: string) => {
    const storageData = await StorageMain.read("server", null);
    const records = storageData?.records || [];
    return records.find(
        (r: any) => r.name === serverName && r.version === serverVersion,
    );
};

const buildModelConfig = (
    funcName: string,
    serverName: string,
    serverTitle: string,
    serverVersion: string,
    param: any,
) => {
    switch (funcName) {
        case "soundTts":
            return {
                type: "SoundTts",
                ttsServerKey: `${serverName}|${serverVersion}`,
                ttsParam: param?.param || {},
                text: param?.text || "",
            };
        case "soundClone":
            return {
                type: "SoundClone",
                cloneServerKey: `${serverName}|${serverVersion}`,
                cloneParam: param?.param || {},
                text: param?.text || "",
                promptUrl: param?.promptAudio || "",
                promptText: param?.promptText || "",
            };
        case "videoGen":
            return {
                soundType: "soundCustom",
                soundCustomFile: param?.audio || "",
                videoTemplateUrl: param?.video || "",
            };
        case "asr":
            return {
                audio: param?.audio || "",
            };
        case "textToImage":
            return {
                prompt: param?.prompt || "",
                textToImage: {
                    serverName,
                    serverTitle,
                    serverVersion,
                    type: "TextToImage",
                    serverKey: `${serverName}|${serverVersion}`,
                    param: param?.param || {},
                },
            };
        case "imageToImage":
            return {
                image: param?.image || "",
                prompt: param?.prompt || "",
                imageToImage: {
                    serverName,
                    serverTitle,
                    serverVersion,
                    type: "ImageToImage",
                    serverKey: `${serverName}|${serverVersion}`,
                    param: param?.param || {},
                },
            };
        default:
            return param || {};
    }
};

const buildTaskParam = (funcName: string, param: any) => {
    if (funcName === "videoGen" || funcName === "asr") {
        return param?.param || {};
    }
    return {};
};

const buildTaskTitle = (funcName: string, param: any): string => {
    switch (funcName) {
        case "soundTts":
            return param?.text ? String(param.text).slice(0, 20) : "TTS任务";
        case "soundClone":
            return param?.text
                ? String(param.text).slice(0, 20)
                : "音色克隆任务";
        case "videoGen":
            return "AI数字人视频";
        case "asr":
            return "ASR识别任务";
        case "textToImage":
            return param?.prompt
                ? String(param.prompt).slice(0, 20)
                : "文生图任务";
        case "imageToImage":
            return param?.prompt
                ? String(param.prompt).slice(0, 20)
                : "图生图任务";
        default:
            return "任务";
    }
};

const sendJson = (res: Response, statusCode: number, data: any) => {
    res.status(statusCode).json(data);
};

const createApp = (port: number, token: string) => {
    const app = express();
    app.use(express.json());
    app.use((_req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization",
        );
        if (_req.method === "OPTIONS") {
            res.status(200).end();
            return;
        }
        next();
    });

    app.get("/doc", (_req, res) => {
        const html = docHtml.replace(/\{\{PORT\}\}/g, String(port));
        res.status(200)
            .set("Content-Type", "text/html; charset=utf-8")
            .send(html);
    });

    app.use((_req, res, next) => {
        const auth = _req.headers["authorization"] || "";
        if (!auth.startsWith("Bearer ") || auth.slice(7) !== token) {
            sendJson(res, 401, { code: -1, msg: "Unauthorized" });
            return;
        }
        next();
    });

    app.post("/api/model/list", async (_req, res) => {
        try {
            const servers = await getInstalledServers();
            sendJson(res, 200, { code: 0, data: servers });
        } catch (e) {
            sendJson(res, 500, { code: -1, msg: String(e) });
        }
    });

    app.post("/api/model/call", async (req, res) => {
        try {
            const { model, function: funcName, param } = req.body || {};
            const parts = (model || "").split("|");
            const serverName = parts[0];
            const serverVersion = parts.slice(1).join("|");
            if (!serverName || !serverVersion) {
                sendJson(res, 400, {
                    code: -1,
                    msg: 'Invalid model format, expected "name|version"',
                });
                return;
            }
            if (!funcName) {
                sendJson(res, 400, { code: -1, msg: "Missing function" });
                return;
            }
            const biz = functionBizMap[funcName];
            if (!biz) {
                sendJson(res, 400, {
                    code: -1,
                    msg: `Unknown function: ${funcName}`,
                });
                return;
            }
            const serverRecord = await getServerRecord(
                serverName,
                serverVersion,
            );
            if (!serverRecord) {
                sendJson(res, 400, {
                    code: -1,
                    msg: `Server not found: ${serverName}|${serverVersion}`,
                });
                return;
            }
            const serverTitle = serverRecord.title || serverName;
            const modelConfig = buildModelConfig(
                funcName,
                serverName,
                serverTitle,
                serverVersion,
                param,
            );
            const taskParam = buildTaskParam(funcName, param);
            const title = buildTaskTitle(funcName, param);
            const taskDbId = await DBMain.insert(
                `INSERT INTO data_task (biz, title, status, startTime, serverName, serverTitle, serverVersion, param, jobResult, modelConfig, result, type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    biz,
                    title,
                    "queue",
                    Date.now(),
                    serverName,
                    serverTitle,
                    serverVersion,
                    JSON.stringify(taskParam),
                    JSON.stringify({}),
                    JSON.stringify(modelConfig),
                    JSON.stringify({}),
                    1,
                ],
            );
            const taskId = String(taskDbId);
            sendJson(res, 200, { code: 0, data: { taskId } });
            Events.callPage("main", "httpserver:submitTask", {
                biz,
                taskId,
            }).catch((err) => {
                Log.error("httpserver.submitTask.error", err);
            });
        } catch (e) {
            sendJson(res, 500, { code: -1, msg: `Internal error: ${e}` });
        }
    });

    app.post("/api/model/query", async (req, res) => {
        try {
            const { taskId } = req.body || {};
            if (!taskId) {
                sendJson(res, 400, { code: -1, msg: "Missing taskId" });
                return;
            }
            const LONG_POLL_MS = 60_000;
            const POLL_INTERVAL_MS = 500;
            const deadline = Date.now() + LONG_POLL_MS;
            const queryOnce = async () => {
                const record = await DBMain.first(
                    "SELECT * FROM data_task WHERE id = ?",
                    [taskId],
                );
                if (!record) {
                    return {
                        done: true,
                        payload: {
                            code: 0,
                            data: { status: "error", error: "Task not found" },
                        },
                    };
                }
                if (record.status === "success") {
                    let result: any = null;
                    try {
                        const parsed = JSON.parse(record.result);
                        if (parsed && Object.keys(parsed).length > 0)
                            result = parsed;
                    } catch (_) {}
                    if (result) {
                        return {
                            done: true,
                            payload: {
                                code: 0,
                                data: {
                                    status: "success",
                                    result: {
                                        code: 0,
                                        msg: "ok",
                                        data: {
                                            type: "success",
                                            start: record.startTime || 0,
                                            end: record.endTime || 0,
                                            data: result,
                                        },
                                    },
                                },
                            },
                        };
                    }
                } else if (record.status === "fail") {
                    return {
                        done: true,
                        payload: {
                            code: 0,
                            data: {
                                status: "error",
                                error: record.statusMsg || "Task failed",
                            },
                        },
                    };
                }
                return { done: false, payload: null };
            };
            while (true) {
                const { done, payload } = await queryOnce();
                if (done) {
                    sendJson(res, 200, payload!);
                    return;
                }
                if (Date.now() >= deadline) break;
                await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
            }
            sendJson(res, 200, { code: 0, data: { status: "pending" } });
        } catch (e) {
            sendJson(res, 500, { code: -1, msg: `Internal error: ${e}` });
        }
    });

    app.use((_req, res) => {
        sendJson(res, 404, { code: -1, msg: "Not found" });
    });

    return app;
};

const start = async (port?: number): Promise<void> => {
    if (isRunning) {
        await stop();
    }
    const resolvedPort = port || (await getAvailablePort());
    const token = generateToken();
    await ConfigMain.set("httpServerPort", resolvedPort);
    await ConfigMain.set("httpServerToken", token);
    writeCliAuthFile(resolvedPort, token);
    return new Promise((resolve, reject) => {
        const app = createApp(resolvedPort, token);
        const s = http.createServer(app);
        s.listen(resolvedPort, "127.0.0.1", () => {
            server = s;
            isRunning = true;
            runningPort = resolvedPort;
            runningToken = token;
            Log.info("httpserver.start", { port: resolvedPort });
            resolve();
        });
        s.on("error", (err: any) => {
            Log.error("httpserver.error", err);
            reject(err);
        });
    });
};

const stop = async (): Promise<void> => {
    return new Promise((resolve) => {
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
        return { code: 0 };
    } catch (e) {
        return { code: -1, msg: String(e) };
    }
});

ipcMain.handle("httpserver:stop", async () => {
    await stop();
    return { code: 0 };
});

export const HttpServerMain = {
    start,
    stop,
    status,
};

export default HttpServerMain;
