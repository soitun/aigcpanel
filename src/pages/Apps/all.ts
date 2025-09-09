import {t} from "../../lang";
import SoundReplace from "./SoundReplace/SoundReplace.vue";
import SubtitleTts from "./SubtitleTts/SubtitleTts.vue";
import VideoGenFlow from "./VideoGenFlow/VideoGenFlow.vue";

import SoundReplaceIcon from "./SoundReplace/assets/icon.svg";
import SubtitleTtsIcon from "./SubtitleTts/assets/icon.svg";
import VideoGenFlowIcon from "./VideoGenFlow/assets/icon.svg";
import FeedbackIcon from "./../../assets/image/feedback.svg";

export const SoundApps = [
    {
        name: "SoundReplace",
        title: t("声音替换"),
        description: t("将视频中的人声替换为其他音色"),
        icon: SoundReplaceIcon,
        component: SoundReplace,
    },
    {
        name: "SubtitleTts",
        title: t("字幕转音频"),
        description: t("将字幕文件转换为音频文件"),
        icon: SubtitleTtsIcon,
        component: SubtitleTts,
    },
];

export const VideoApps = [
    {
        name: "VideoGenFlow",
        title: t("数字人一键合成"),
        description: t("输入文本自动合成音频驱动口型合成视频"),
        icon: VideoGenFlowIcon,
        component: VideoGenFlow,
    },
];

export const AllApps = [
    ...(SoundApps.map(app => ({
        ...app,
        url: `/sound?tab=${app.name}`,
    })) as any),
    ...(VideoApps.map(app => ({
        ...app,
        url: `/video?tab=${app.name}`,
    })) as any),
    {
        title: t("工具需求"),
        description: t("更多工具提交需求给我们"),
        icon: FeedbackIcon,
        url: "https://aigcpanel.com/wish",
    },
];
