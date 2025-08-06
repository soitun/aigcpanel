import {SoundAsrParamType, SoundGenerateParamType} from "../../../types/App";

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
    // 5 替换 Combile
    step: "ToAudio" | "SoundAsr" | "Confirm" | "SoundGenerate" | "Combile";
    ToAudio: {
        file: string;
    };

    SoundAsr: ServerCallFunctionResultData & {
        data: {
            records: {start: number; end: number; text: string}[];
        };
    };
    Confirm: {};
    SoundGenerate: ServerCallFunctionResultData & {
        data: {};
    };
    Combile: {
        file: string;
    };
};
