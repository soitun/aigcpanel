import { ComputedRef } from "@vue/reactivity";
import { cloneDeep } from "lodash-es";
import { defineStore } from "pinia";
import { computed, ref, toRaw } from "vue";
import { t } from "../../lang";
import { Dialog } from "../../lib/dialog";
import { TimeUtil, wait } from "../../lib/util";
import { StorageService } from "../../service/StorageService";
import { TaskService } from "../../service/TaskService";
import {
    EnumServerStatus,
    EnumServerType,
    ServerRecord,
    ServerRuntime,
} from "../../types/Server";
import store from "../index";

import { useTaskStore } from "./task";
import { ServerInfo } from "../../../electron/mapi/server/type";


const taskStore = useTaskStore();
const serverRuntime = ref<Map<string, ServerRuntime>>(new Map());
const createServerStatus = (
    record: ServerRecord,
): ComputedRef<EnumServerStatus> => {
    return computed(() => {
        if (record.type === EnumServerType.CLOUD || record.autoStart) {
            return EnumServerStatus.RUNNING;
        }
        return (
            serverRuntime.value?.get(record.key)?.status ||
            EnumServerStatus.STOPPED
        );
    });
};
const getServerRuntimeComputedValue = (
    record: ServerRecord,
): ComputedRef<ServerRuntime> => {
    return computed(() => {
        let defaultStatus = EnumServerStatus.STOPPED;
        if (record.type === EnumServerType.CLOUD || record.autoStart) {
            defaultStatus = EnumServerStatus.RUNNING;
        }
        return (
            serverRuntime.value?.get(record.key) ||
            ({
                status: defaultStatus,
            } as ServerRuntime)
        );
    });
};
const getOrCreateServerRuntime = (record: ServerRecord): ServerRuntime => {
    const value = serverRuntime.value?.get(record.key);
    if (value) {
        return value;
    }
    const defaultValue = {
        status: EnumServerStatus.STOPPED,
        autoStartStatus: EnumServerStatus.STOPPED,
        eventChannelName: undefined,
        logFile: "",
    } as ServerRuntime;
    if (record.type === EnumServerType.CLOUD || record.autoStart) {
        defaultValue.status = EnumServerStatus.RUNNING;
        defaultValue.eventChannelName = createEventChannel(
            record,
            defaultValue,
        );
        defaultValue.logFile = `logs/${record.name}_${record.version}_${TimeUtil.dateString()}.log`;
    }
    serverRuntime.value?.set(record.key, defaultValue);
    return serverRuntime.value?.get(record.key) as ServerRuntime;
};
const deleteServerRuntime = (record: ServerRecord) => {
    serverRuntime.value?.delete(record.key);
};

const createEventChannel = (
    server: ServerRecord,
    serverRuntime?: ServerRuntime,
) => {
    if (!serverRuntime) {
        serverRuntime = getOrCreateServerRuntime(server);
    }
    const eventChannel = window.__page.createChannel(function (channelData) {
        const { type, data } = channelData;
        switch (type) {
            case "success":
                clearTimeout(serverRuntime.pingCheckTimer);
                serverRuntime.status = EnumServerStatus.STOPPED;
                window.__page.destroyChannel(eventChannel);
                updateRunningServerCount().then();
                break;
            case "error":
                clearTimeout(serverRuntime.pingCheckTimer);
                serverRuntime.status = EnumServerStatus.ERROR;
                window.__page.destroyChannel(eventChannel);
                updateRunningServerCount().then();
                break;
            case "starting":
            case "stopping":
            case "stopped":
                break;
            case "action":
                switch (data.type) {
                    case "LoginRequired":
                        Dialog.tipError(data.msg || t("common.loginRequired"));
                        setTimeout(() => {
                            $mapi.user.open().then();
                        }, 2000);
                        break;
                    
                }
                break;
            case "liveTalk":
                StorageService.add("LiveTalk", {
                    title: data.title,
                    content: {
                        content: data.content,
                    },
                }).then();
                break;
            case "taskRunning":
            case "taskResult":
            case "taskStatus":
                const { id } = data;
                const { biz, bizId } = serverStoreInstance.parseTaskId(id);
                // console.log('task', {type, biz, bizId, data})
                const taskUpdate = async (bizId: string, data: any) => {
                    const bizer = taskStore.get(biz);
                    if (bizer && bizer.update) {
                        await bizer.update(bizId, data);
                    } else {
                        await TaskService.update(bizId, data);
                    }
                };
                const taskFireRunning = async () => {
                    taskStore.fireChange(
                        {
                            biz,
                            bizId,
                        } as any,
                        "running",
                    );
                };
                if ("taskRunning" === type) {
                    taskUpdate(bizId, {
                        status: "running",
                        startTime: TimeUtil.timestampMS(),
                    }).then(taskFireRunning);
                } else if ("taskResult" === type) {
                    taskUpdate(bizId, {
                        result: data.result,
                    }).then(taskFireRunning);
                }
                break;
            default:
                console.log("eventChannel.unknown", type, data);
                break;
        }
    });
    return eventChannel;
};

const updateRunningServerCount = async () => {
    const count = serverStoreInstance.records.filter((r) => {
        return (
            r.type === EnumServerType.LOCAL_DIR &&
            r.status === EnumServerStatus.RUNNING &&
            !r.autoStart
        );
    }).length;
    await $mapi.server.runningServerCount(count);
};

export const serverStore = defineStore("server", {
    state: () => ({
        isReady: false,
        records: [] as ServerRecord[],
    }),
    actions: {
        async waitReady() {
            await wait(() => this.isReady);
            
        },
        async init() {
            await $mapi.storage.get("server", "records", []).then((records) => {
                records.forEach((record: ServerRecord) => {
                    record.status = createServerStatus(record);
                    record.runtime = getServerRuntimeComputedValue(record);
                });
                this.records = records.filter((record: ServerRecord) => {
                    return record.type !== EnumServerType.CLOUD;
                });
            });
            taskStore.onChange(null, (bizId, type) => {
                if (type === "requestCancel") {
                    TaskService.get(bizId).then((record) => {
                        if (
                            record &&
                            record.serverName &&
                            record.serverVersion
                        ) {
                            this.cancelByNameVersion(
                                record.serverName,
                                record.serverVersion,
                            ).then();
                        }
                    });
                }
            });
            await this.refresh();
            this.isReady = true;
        },
        // 从 storage 重新加载 server records（CLI 安装/卸载模型后由页面事件触发），
        // 不会重复注册任务取消监听。
        async reloadRecords() {
            await $mapi.storage.get("server", "records", []).then((records) => {
                records.forEach((record: ServerRecord) => {
                    record.status = createServerStatus(record);
                    record.runtime = getServerRuntimeComputedValue(record);
                });
                this.records = records.filter((record: ServerRecord) => {
                    return record.type !== EnumServerType.CLOUD;
                });
            });
            await this.refresh();
        },
        async refresh() {
            const dirs = await $mapi.file.list("model", {
                isDataPath: true,
            });
            const localRecords: ServerRecord[] = [];
            for (let dir of dirs) {
                const config = await $mapi.file.read(
                    `model/${dir.name}/config.json`,
                    {
                        isDataPath: true,
                    },
                );
                let json;
                try {
                    json = JSON.parse(config);
                } catch (e) {
                    continue;
                }
                if (!json) {
                    continue;
                }
                localRecords.push({
                    key: this.generateServerKey({
                        name: json.name,
                        version: json.version,
                    } as any),
                    name: json.name || dir.name,
                    title: json.title || dir.name,
                    version: json.version || "1.0.0",
                    type: EnumServerType.LOCAL,
                    // EasyServer（含 ComfyUI，其 entry 亦为 __EasyServer__）默认自启动
                    autoStart: json.entry === "__EasyServer__",
                    functions: json.functions || [],
                    localPath: `model/${dir.name}`,
                    settings: json.settings || [],
                    setting: json.setting || {},
                    config: json,
                } as ServerRecord);
            }
            let changed = false;
            for (let lr of localRecords) {
                const record = this.records.find(
                    (record) => record.key === lr.key,
                );
                if (!record) {
                    lr.status = createServerStatus(lr);
                    lr.runtime = getServerRuntimeComputedValue(lr);
                    this.records.unshift(lr as any);
                    changed = true;
                } else {
                    if (!record.settings && lr.settings) {
                        record.settings = lr.settings;
                        changed = true;
                    }
                    // 同步 functions / config / title（模型能力或配置更新后保持最新）
                    if (
                        JSON.stringify(record.functions) !==
                        JSON.stringify(lr.functions)
                    ) {
                        record.functions = lr.functions;
                        changed = true;
                    }
                    if (
                        JSON.stringify(record.config) !==
                        JSON.stringify(lr.config)
                    ) {
                        record.config = lr.config;
                        changed = true;
                    }
                    if (record.title !== lr.title) {
                        record.title = lr.title;
                        changed = true;
                    }
                    // 存量记录自动补齐 autoStart 标记（entry 已为 __EasyServer__ 的模型）
                    if (lr.autoStart && !record.autoStart) {
                        record.autoStart = true;
                        changed = true;
                    }
                }
            }
            if (changed) {
                await this.sync();
            }
        },
        async prepareForTask(bizId: string, bizParam: any) {
            const record = await TaskService.get(bizId as any);
            // console.log('SoundTts.runFunc.record', record)
            if (!record) {
                throw "record not found";
            }
            let server: any = null;
            let serverInfo: any = null;
            if (record.serverName && record.serverVersion) {
                server = await this.getByNameVersion(
                    record.serverName,
                    record.serverVersion,
                );
                // console.log('SoundTts.runFunc.server', server)
                if (!server) {
                    throw "server not found";
                }
                serverInfo = await this.serverInfo(server);
            }
            return {
                record,
                server,
                serverInfo,
            };
        },
        generateTaskId(biz: string, bizId: string) {
            return `${biz}_${bizId}`;
        },
        parseTaskId(taskId: string) {
            const parts = taskId.split("_");
            if (parts.length < 2) {
                throw new Error("InvalidTaskId");
            }
            return {
                biz: parts[0],
                bizId: parts.slice(1).join("_"),
            };
        },
        findRecord(server: ServerRecord) {
            return this.records.find((record) => record.key === server.key);
        },
        start: async function (server: ServerRecord) {
            const record = this.findRecord(server);
            if (!record) {
                throw "RecordNotFound";
            }
            if (
                record.status === EnumServerStatus.STOPPED ||
                record.status === EnumServerStatus.ERROR
            ) {
            } else if (record.status === EnumServerStatus.RUNNING) {
                // 已在运行，直接返回
                return;
            } else if (record.status === EnumServerStatus.STARTING) {
                // 已在启动中，直接返回（调用方负责等待就绪）
                return;
            } else {
                throw "StatusError";
            }
            const serverRuntime = getOrCreateServerRuntime(server);
            serverRuntime.status = EnumServerStatus.STARTING;
            serverRuntime.startTimestampMS = TimeUtil.timestampMS();
            serverRuntime.logFile = `logs/${server.name}_${server.version}_${TimeUtil.dateString()}_${
                serverRuntime.startTimestampMS
            }.log`;
            serverRuntime.eventChannelName = createEventChannel(server);
            const serverInfo = await this.serverInfo(server);
            await $mapi.server.start(serverInfo);
            let pingTimeout = 60 * 5 * 1000;
            let pingStart = TimeUtil.timestampMS();
            const pingCheck = () => {
                const now = TimeUtil.timestampMS();
                if (now - pingStart > pingTimeout) {
                    // console.log('ping.timeout')
                    serverRuntime.status = EnumServerStatus.ERROR;
                    $mapi.server.stop(serverInfo);
                    return;
                }
                $mapi.server
                    .ping(serverInfo)
                    .then((success) => {
                        if (success) {
                            serverRuntime.status = EnumServerStatus.RUNNING;
                            updateRunningServerCount().then();
                        } else {
                            serverRuntime.pingCheckTimer = setTimeout(
                                pingCheck,
                                2000,
                            );
                        }
                    })
                    .catch((err) => {
                        serverRuntime.pingCheckTimer = setTimeout(
                            pingCheck,
                            2000,
                        );
                    });
            };
            serverRuntime.pingCheckTimer = setTimeout(pingCheck, 2 * 1000);
        },
        async stop(server: ServerRecord) {
            const record = this.findRecord(server);
            if (
                record?.status !== EnumServerStatus.RUNNING &&
                record?.status !== EnumServerStatus.STARTING &&
                record?.status !== EnumServerStatus.STOPPING
            ) {
                // 未运行或已停止，直接返回（幂等）
                return;
            }
            const serverRuntime = getOrCreateServerRuntime(server);
            serverRuntime.status = EnumServerStatus.STOPPING;
            const serverInfo = await this.serverInfo(server);
            serverInfo.logFile = serverRuntime.logFile;
            await $mapi.server.stop(serverInfo);
        },
        async cancel(server: ServerRecord) {
            const record = this.findRecord(server);
            if (record?.status === EnumServerStatus.RUNNING) {
            } else {
                throw new Error("StatusError");
            }
            const serverRuntime = getOrCreateServerRuntime(server);
            const serverInfo = await this.serverInfo(server);
            serverInfo.logFile = serverRuntime.logFile;
            await $mapi.server.cancel(serverInfo);
        },
        async updateSetting(key: string, setting: any) {
            const record = this.records.find((record) => record.key === key);
            if (!record) {
                return;
            }
            record.setting = Object.assign(record.setting || {}, setting);
            await this.sync();
        },
        async delete(server: ServerRecord) {
            const index = this.records.findIndex(
                (record) => record.key === server.key,
            );
            if (index === -1) {
                return;
            }
            const record = this.records[index];
            if (
                record.autoStart ||
                record.status === EnumServerStatus.STOPPED ||
                record.status === EnumServerStatus.ERROR
            ) {
            } else {
                if (record.type === EnumServerType.LOCAL_DIR) {
                    throw new Error("StatusError");
                }
            }
            const serverInfo = await this.serverInfo(server);
            $mapi.server.deletes(serverInfo).then();
            if (record.type === EnumServerType.LOCAL) {
                await $mapi.file.deletes(record.localPath as string, {
                    isDataPath: true,
                });
            }
            this.records.splice(index, 1);
            deleteServerRuntime(server);
            await this.sync();
        },
        async add(server: ServerRecord) {
            let record = this.records.find(
                (record) => record.key === server.key,
            );
            if (record) {
                return;
            }
            server.status = createServerStatus(server);
            server.runtime = getServerRuntimeComputedValue(server);
            this.records.unshift(server);
            await this.sync();
        },
        async sync() {
            const savedRecords = toRaw(cloneDeep(this.records));
            savedRecords.forEach((record) => {
                record.status = undefined;
                record.runtime = undefined;
            });
            await $mapi.storage.set("server", "records", savedRecords);
        },
        async getByKey(key: string): Promise<ServerRecord | undefined> {
            
            return this.records.find((record) => record.key === key);
        },
        async getByNameVersion(
            name: string,
            version: string,
        ): Promise<ServerRecord | undefined> {
            
            return this.records.find(
                (record) => record.name === name && record.version === version,
            );
        },
        async cancelByNameVersion(name: string, version: string) {
            const record = await this.getByNameVersion(name, version);
            if (record) {
                await this.cancel(record);
            }
        },
        generateServerKey(server: ServerRecord) {
            return `${server.name}|${server.version}`;
        },
        async call(
            serverInfo: ServerInfo,
            method: string,
            data: ServerCallFunctionData,
            option?: ServerCallFunctionOption,
        ): Promise<ServerCallFunctionResult> {
            await this.callStart(serverInfo);
            try {
                // comfyui 类型服务：自启动（任务触发自动拉起、空闲自动退出）
                const server = await this.getByNameVersion(
                    serverInfo.name,
                    serverInfo.version,
                );
                if (server && server.config?.type === "comfyui") {
                    const runtime = getOrCreateServerRuntime(server);
                    let serverInfoForPing = await this.serverInfo(server);
                    // 以 HTTP ping 判断服务是否已在运行（不依赖 runtime.status，
                    // 兼容 autoStart 模型初始状态恒为 RUNNING 但进程未启动的情况）
                    let ready = false;
                    try {
                        ready = await $mapi.server.ping(serverInfoForPing);
                    } catch (e) {
                        ready = false;
                    }
                    if (!ready) {
                        // 直接强制拉起服务：不能走 serverStore.start()——
                        // autoStart 模型 record.status 恒为 RUNNING，会导致
                        // start() 的状态检查短路直接返回（服务永不启动）。
                        runtime.status = EnumServerStatus.STARTING;
                        runtime.startTimestampMS = TimeUtil.timestampMS();
                        runtime.logFile = `logs/${server.name}_${server.version}_${TimeUtil.dateString()}_${runtime.startTimestampMS}.log`;
                        runtime.eventChannelName = createEventChannel(server);
                        // 重新获取 serverInfo（含 logFile / eventChannelName）
                        serverInfoForPing = await this.serverInfo(server);
                        await $mapi.server.start(serverInfoForPing);
                    }
                    // 等待服务就绪：优先 HTTP ping（不依赖事件通道）。
                    // 用独立变量记录是否真正就绪——runtime.status 对 autoStart
                    // 模型初始就是 RUNNING，不能作为就绪判断依据。
                    let startedOk = false;
                    const deadline = Date.now() + 5 * 60 * 1000;
                    while (Date.now() < deadline) {
                        let ok = false;
                        try {
                            ok = await $mapi.server.ping(serverInfoForPing);
                        } catch (e) {
                            ok = false;
                        }
                        if (ok) {
                            runtime.status = EnumServerStatus.RUNNING;
                            startedOk = true;
                            break;
                        }
                        await wait(2000);
                    }
                    if (!startedOk) {
                        throw new Error("comfyui server start timeout");
                    }
                }
                return await $mapi.server.callFunctionWithException(
                    serverInfo,
                    method,
                    data,
                    option,
                );
            } finally {
                // 无论调用成功/失败都必须复位 autoStartStatus，
                // 否则 autoStart 模型状态会一直停留在"运行中"。
                // 此处容错避免 callEnd 异常覆盖真实调用结果。
                try {
                    await this.callEnd(serverInfo);
                } catch (e) {
                    // ignore callEnd error
                }
            }
        },
        async callStart(serverInfo: ServerInfo) {
            const server = await this.getByNameVersion(
                serverInfo.name,
                serverInfo.version,
            );
            if (!server) {
                throw new Error("ServerNotFound");
            }
            const serverRuntime = getOrCreateServerRuntime(server);
            if (server.autoStart) {
                serverRuntime.autoStartStatus = EnumServerStatus.RUNNING;
            }
        },
        async callEnd(serverInfo: ServerInfo) {
            const server = await this.getByNameVersion(
                serverInfo.name,
                serverInfo.version,
            );
            if (!server) {
                throw new Error("ServerNotFound");
            }
            const serverRuntime = getOrCreateServerRuntime(server);
            if (server.autoStart) {
                serverRuntime.autoStartStatus = EnumServerStatus.STOPPED;
            }
        },
        async serverInfo(server: ServerRecord) {
            const result = {
                localPath: "",
                name: server.name,
                version: server.version,
                type: server.type,
                setting: toRaw(server.setting),
                logFile: "",
                eventChannelName: "",
                config: JSON.parse(JSON.stringify(server)),
            };
            if (server.type === EnumServerType.LOCAL) {
                result.localPath = await $mapi.file.fullPath(
                    server.localPath as string,
                );
            } else if (server.type === EnumServerType.LOCAL_DIR) {
                result.localPath = server.localPath as string;
            } else if (server.type === EnumServerType.CLOUD) {
                result.localPath = server.localPath as string;
            } else if (server.type === EnumServerType.REMOTE) {
                result.localPath = await $mapi.file.fullPath(
                    server.localPath as string,
                );
            }
            const serverRuntime = getOrCreateServerRuntime(server);
            if (serverRuntime) {
                result.logFile = serverRuntime.logFile;
                result.eventChannelName =
                    serverRuntime.eventChannelName as string;
            }
            return result as ServerInfo;
        },
    },
});

const serverStoreInstance = serverStore(store);
serverStoreInstance.init().then();

export const useServerStore = () => {
    return serverStoreInstance;
};
