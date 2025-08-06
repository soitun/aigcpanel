import {SoundGenerateParamType} from "../../../types/App";

export type VideoGenFlowModelConfigType = {
    videoTemplateId: number;
    videoTemplateName: string;
    videoUrl: string;
    soundGenerate: SoundGenerateParamType;
    text: string;
};
