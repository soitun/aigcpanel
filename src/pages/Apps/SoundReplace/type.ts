import {SoundAsrParamType, SoundGenerateParamType} from "../../../types/App";

export type SoundReplaceModelConfigType = {
    video: string;
    soundAsr: SoundAsrParamType;
    soundGenerate: SoundGenerateParamType;
};
