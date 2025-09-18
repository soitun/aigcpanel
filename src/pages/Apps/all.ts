import {t} from "../../lang";

import LongTextTts from "./LongTextTts/LongTextTts.vue";
import SubtitleTts from "./SubtitleTts/SubtitleTts.vue";
import SoundReplace from "./SoundReplace/SoundReplace.vue";

import VideoGenFlow from "./VideoGenFlow/VideoGenFlow.vue";

import LongTextTtsIcon from "./LongTextTts/assets/icon.svg";
import SubtitleTtsIcon from "./SubtitleTts/assets/icon.svg";
import SoundReplaceIcon from "./SoundReplace/assets/icon.svg";

import VideoGenFlowIcon from "./VideoGenFlow/assets/icon.svg";

import TextToImage from "./TextToImage/TextToImage.vue";
import TextToImageIcon from "./TextToImage/assets/icon.svg";
import ImageToImage from "./ImageToImage/ImageToImage.vue";
import ImageToImageIcon from "./ImageToImage/assets/icon.svg";

import FeedbackIcon from "./../../assets/image/feedback.svg";

export const SoundApps = [
    {
        name: "LongTextTts",
        title: t("长文本转音频"),
        description: t("将长文本内容转换为音频文件"),
        icon: LongTextTtsIcon,
        component: LongTextTts,
    },
    {
        name: "SubtitleTts",
        title: t("字幕转音频"),
        description: t("将字幕文件转换为音频文件"),
        icon: SubtitleTtsIcon,
        component: SubtitleTts,
    },
    {
        name: "SoundReplace",
        title: t("声音替换"),
        description: t("将视频中的人声替换为其他音色"),
        icon: SoundReplaceIcon,
        component: SoundReplace,
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

export const ImageApps = [
    {
        name: "TextToImage",
        title: t("文生图"),
        description: t("根据文本描述生成图片"),
        icon: TextToImageIcon,
        component: TextToImage,
    },
    {
        name: "ImageToImage",
        title: t("图生图"),
        description: t("根据输入图片+描述提示生成新的图片"),
        icon: ImageToImageIcon,
        component: ImageToImage,
    }
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
    ...(ImageApps.map(app => ({
        ...app,
        url: `/image?tab=${app.name}`,
    })) as any),
    {
        title: t("工具需求"),
        description: t("更多工具提交需求给我们"),
        icon: FeedbackIcon,
        url: "https://aigcpanel.com/wish",
    },
];
