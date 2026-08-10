import {
    SendType,
    ServerApiType,
    ServerContext,
    ServerInfo,
} from "../mapi/server/type";
import { Files } from "../mapi/file/main";
import { Log } from "../mapi/log/main";
import { EncodeUtil } from "../lib/util";

const serverRuntime = {
    port: 0,
};

let shellController = null;
let isRunning = false;

/**
 * 任务结果缓存：taskId -> result（从 launcher stdout 标准输出解析）
 * stdout 中格式：AigcPanelRunResult[<taskId>][<base64 json>]
 */
const taskResults: {
    [taskId: string]: {
        result: any;
        endTime: number;
    };
} = {};

/**
 * 从 stdout 数据流中解析 AigcPanelRunResult[<id>][<base64>] 结果
 * 解析成功后缓存到 taskResults
 */
function extractResultFromStdout(data: string): void {
    if (!data) return;
    const regex = /AigcPanelRunResult\[([^\]]+)\]\[(.*?)\]/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(data)) !== null) {
        const taskId = match[1];
        const b64 = match[2];
        try {
            const result = JSON.parse(EncodeUtil.base64Decode(b64));
            taskResults[taskId] = {
                result,
                endTime: Date.now(),
            };
        } catch (e) {
            Log.error("comfyui.extractResult.error", {
                taskId,
                error: String(e),
            });
        }
    }
}

/**
 * ComfyUI 服务器管理（type=comfyui 的模型服务）
 *
 * 通过 launcher 以 watch 常驻模式启动：
 *   - 启动时动态分配端口（AIGCPANEL_SERVER_PORT），避免多个 comfyui 冲突
 *   - 服务常驻，通过 aigcpanel-queue/*.queue.json 通讯下发工作流任务
 *   - 任务结果通过 launcher stdout 标准输出（AigcPanelRunResult[<id>][<base64>]）返回
 *   - url() 返回 ComfyUI Web UI 地址，供 BrowserWindow 查看
 */
export const ComfyUIServer: ServerContext = {
    ServerApi: null as ServerApiType | null,
    ServerInfo: null as ServerInfo | null,
    url() {
        // 使用 127.0.0.1 避免 localhost 解析到 IPv6 ::1 导致连接失败
        return `http://127.0.0.1:${serverRuntime.port}/`;
    },
    send(type: SendType, data: any) {
        this.ServerApi.event.sendChannel(this.ServerInfo.eventChannelName, {
            type,
            data,
        });
    },
    async init() {},
    async start() {
        this.send("starting", this.ServerInfo);
        let command = [];
        // 动态分配端口（优先使用 setting.port，否则自动获取可用端口）
        serverRuntime.port = await this.ServerApi.availablePort(
            serverRuntime.port,
            this.ServerInfo.setting,
        );
        const env = await this.ServerApi.env();
        const launcher = `${this.ServerInfo.localPath}/launcher`;
        command.push(`"${launcher}"`);
        env["PATH"] = this.ServerApi.getPathEnv([
            `${this.ServerInfo.localPath}`,
            `${this.ServerInfo.localPath}/binary`,
        ]);
        env["PYTHONIOENCODING"] = "utf-8";
        // 动态端口注入，避免多实例冲突
        env["AIGCPANEL_SERVER_PORT"] = `${serverRuntime.port}`;
        // 开发模式跳过 launcher 登录检查（生产环境由平台认证，勿设置）
        env["AIGCPANEL_SERVER_DEV"] = "1";
        env["AIGCPANEL_SERVER_PLACEHOLDER_CONFIG"] =
            await this.ServerApi.launcherPrepareConfigJson({
                id: "comfyui",
                mode: { type: "watch", watchDelay: 3 },
                modelConfig: {},
                setting: this.ServerInfo.setting,
            });
        // console.log('command', JSON.stringify(command))
        shellController = await this.ServerApi.app.spawnShell(command, {
            stdout: (data) => {
                this.ServerApi.file.appendText(this.ServerInfo.logFile, data, {
                    isDataPath: true,
                });
                // 从 stdout 标准输出解析任务结果
                extractResultFromStdout(data);
                const result = this.ServerApi.extractResultFromLogs(
                    "comfyui",
                    data,
                );
                if (result) {
                    if (result["Action"]) {
                        const action = result["Action"].split(":");
                        this.send("action", {
                            type: action[0],
                            msg: action.length > 1 ? action[1] : "",
                        });
                    }
                }
            },
            stderr: (data) => {
                this.ServerApi.file.appendText(this.ServerInfo.logFile, data, {
                    isDataPath: true,
                });
            },
            success: (data) => {
                this.send("success", this.ServerInfo);
            },
            error: (data, code) => {
                this.ServerApi.file.appendText(this.ServerInfo.logFile, data, {
                    isDataPath: true,
                });
                this.send("error", this.ServerInfo);
            },
            env,
            cwd: this.ServerInfo.localPath,
        });
    },
    async ping() {
        if (!serverRuntime.port) {
            return false;
        }
        try {
            const res = await this.ServerApi.request(
                `${this.url()}system_stats`,
            );
            return !!res && !!res["system"];
        } catch (e) {
            // console.log('ping error', e)
        }
        return false;
    },
    async stop() {
        this.send("stopping", this.ServerInfo);
        try {
            if (shellController) {
                shellController.stop();
                shellController = null;
            }
        } catch (e) {
            // console.log('stop error', e)
        }
        serverRuntime.port = 0;
        this.send("stopped", this.ServerInfo);
    },
    async cancel() {
        await this.ServerApi.launcherCancel(this);
    },
    async config() {
        return {
            code: 0,
            msg: "ok",
            data: {
                httpUrl: serverRuntime.port ? this.url() : null,
                content: ``,
                functions: {
                    comfyui: {
                        content: ``,
                        param: [],
                    },
                },
            },
        };
    },

    // ---------- 工作流任务调用（通过 aigcpanel-queue + stdout 通讯） ----------

    /**
     * 向 comfyui 服务下发工作流任务并等待结果。
     * 服务为 watch 常驻模式：任务写入 aigcpanel-queue/*.queue.json，
     * 结果从 launcher stdout 标准输出（AigcPanelRunResult[<id>][<base64>]）实时解析。
     */
    _callFunc: async function (
        data: any,
        configCalculator: (data: any) => Promise<any>,
        resultDataCalculator: (data: any, launcherResult: any) => Promise<any>,
        option?: { timeout: number },
    ) {
        option = Object.assign({ timeout: 24 * 3600 }, option);
        if (isRunning) {
            // 已有任务在执行：返回 retry，不写入 queue（避免任务堆积）
            return {
                code: 0,
                msg: "ok",
                data: { type: "retry", start: 0, end: 0, data: {} },
            };
        }
        isRunning = true;
        const resultData = {
            type: "success",
            start: Date.now(),
            end: 0,
            data: {},
        };
        try {
            this.send("taskRunning", { id: data.id });
            const configData = await configCalculator(data);
            configData.setting = this.ServerInfo.setting;
            // 写入 queue 文件（aigcpanel-queue/*.queue.json）
            const queueName = `${Date.now()}_${data.id}.queue.json`;
            const queuePath = `${this.ServerInfo.localPath}/aigcpanel-queue/${queueName}`;
            await Files.write(queuePath, JSON.stringify(configData), {
                isDataPath: false,
            });
            this.ServerApi.file.appendText(
                this.ServerInfo.logFile,
                `Task queued: ${queueName}\n`,
                { isDataPath: true },
            );

            // 等待结果：从 stdout 解析缓存中获取（AigcPanelRunResult[<id>]）
            const startTime = Date.now();
            const timeoutMS = (option.timeout || 24 * 3600) * 1000;
            const launcherResult = { result: {}, endTime: null };
            while (Date.now() - startTime < timeoutMS) {
                const cached = taskResults[data.id];
                if (cached) {
                    Object.assign(launcherResult.result, cached.result);
                    launcherResult.endTime = cached.endTime;
                    this.send("taskResult", {
                        id: data.id,
                        result: launcherResult.result,
                    });
                    break;
                }
                await new Promise((r) => setTimeout(r, 1000));
            }
            if (!launcherResult.endTime) {
                throw "任务超时或未在 stdout 中产生结果";
            }
            resultData.end = Date.now();
            resultData.data = await resultDataCalculator(data, launcherResult);
            return { code: 0, msg: "ok", data: resultData };
        } catch (e) {
            return { code: -1, msg: e + "" };
        } finally {
            isRunning = false;
        }
    },

    // 文生图：modelConfig.workflowKey = demoTextToImage
    textToImage: async function (data: any) {
        return this._callFunc(
            data,
            async (data: any) => {
                return {
                    id: data.id,
                    mode: "local",
                    modelConfig: {
                        type: "comfyuiWorkflow",
                        workflowKey: "demoTextToImage",
                        param: Object.assign(
                            { prompt: data.prompt },
                            data.param || {},
                        ),
                    },
                };
            },
            async (data: any, launcherResult: any) => {
                if (!("url" in launcherResult.result)) {
                    if (launcherResult.result.error) {
                        throw launcherResult.result.error;
                    }
                    throw "执行失败，请查看模型日志";
                }
                return { url: launcherResult.result.url };
            },
        );
    },

    // 图生图：modelConfig.workflowKey = demoImageToImage（未内置时回退 demo2）
    imageToImage: async function (data: any) {
        return this._callFunc(
            data,
            async (data: any) => {
                return {
                    id: data.id,
                    mode: "local",
                    modelConfig: {
                        type: "comfyuiWorkflow",
                        workflowKey: "demoImageToImage",
                        images: data.image ? [data.image] : [],
                        param: Object.assign(
                            { prompt: data.prompt },
                            data.param || {},
                        ),
                    },
                };
            },
            async (data: any, launcherResult: any) => {
                if (!("url" in launcherResult.result)) {
                    if (launcherResult.result.error) {
                        throw launcherResult.result.error;
                    }
                    throw "执行失败，请查看模型日志";
                }
                return { url: launcherResult.result.url };
            },
        );
    },
};
