export enum EnumServerStatus {
    STOPPED = "stopped",
    STARTING = "starting",
    RUNNING = "running",
    STOPPING = "stopping",
    ERROR = "error",
}

export enum EnumServerType {
    LOCAL = "local",
    LOCAL_DIR = "localDir",
    CLOUD = "cloud",
    REMOTE = "remote",
    /** 云厂商 API 直连模型（如火山引擎、阿里云百炼语音） */
    API = "api",
}

export type ServerRecord = {
    key: string;
    name: string;
    title: string;
    version: string;
    type?: EnumServerType;
    functions: string[];
    localPath?: string;
    autoStart?: boolean;
    settings?: {
        name: string;
        type: string;
        title: any;
        default: any;
        placeholder: string;
        options?: {
            value: any;
            label: string;
        }[];
    }[];
    setting?: {
        [key: string]: any;
    };
    cloudConfig?: any;
    remoteConfig?: any; // Remote model config: { url: string, name: string, version: string, ... }
    // 云厂商 API 模型配置：{ provider: "volcengine" | "aliyun", ...credentials }
    apiConfig?: any;
    status?: any;
    runtime?: ServerRuntime | any;
    config?: {
        [key: string]: any;
    };
};

export type ServerRuntime = {
    status: EnumServerStatus;
    autoStartStatus: EnumServerStatus;
    // shellController: any,
    // httpUrl: string,
    logFile: string;
    pingCheckTimer?: any;
    startTimestampMS?: number;
    eventChannelName?: string;
};
