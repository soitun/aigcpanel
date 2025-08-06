declare type VideoGenModelConfigType = {
    videoTemplateId: number;
    videoTemplateName: string;
    soundType: "soundGenerate" | "soundCustom";
    soundGenerateId: number;
    soundGenerateText: string;
    soundCustomFile: string;
};

declare type SoundAsrParamType = {
    serverName: string;
    serverTitle: string;
    serverVersion: string;
    type: "SoundAsr";
    serverKey: string;
    param: any[];
};

declare type SoundGenerateParamType = {
    serverName: string;
    serverTitle: string;
    serverVersion: string;
    type: "SoundTts" | "SoundClone";
    ttsServerKey?: string;
    ttsParam?: any[];
    cloneServerKey?: string;
    cloneParam?: any[];
    promptId?: number;
    promptTitle?: string;
    promptUrl?: string;
    promptText?: string;
};
