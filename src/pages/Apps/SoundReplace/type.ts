export type SoundReplaceModelConfigType = {
    video: string;
    soundAsr: SoundAsrParamType;
    soundGenerate: SoundGenerateParamType;
};

export type SoundReplaceJobResultType = {
    // 处理步骤
    // 1 转mp3 ToAudio
    // 2 识别 SoundAsr
    // 3 确认 Confirm
    // 4 合成 SoundGenerate
    // 5 替换 Combine
    step: "ToAudio" | "SoundAsr" | "Confirm" | "SoundGenerate" | "Combine" | "End";
    ToAudio: {
        file: string;
    };

    SoundAsr: {
        start: number;
        end: number;
        records: {start: number; end: number; text: string}[];
    };
    Confirm: {
        confirm: boolean;
        records: {start: number; end: number; text: string}[];
    };
    SoundGenerate: {
        start: number;
        end: number;
        records: {start: number; end: number; text: string; audio: string}[];
    };
    Combine: {
        audio: string;
        file: string;
    };
};
