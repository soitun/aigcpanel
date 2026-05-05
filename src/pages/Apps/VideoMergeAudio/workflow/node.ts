import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoMergeAudioRun } from "../task";
import AppIcon from "~icons/mdi/music-note-plus";

export default <NodeFunctionCall>{
    name: "VideoMergeAudio",
    title: "视频添加音频",
    description: "将音频文件合并到视频中",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoMergeAudioNode.vue")),
    inputFields: [
        {
            type: "file",
            name: "Video",
            fileExtensions: ["mp4"],
        },
        {
            type: "file",
            name: "Audio",
            fileExtensions: ["mp3", "wav"],
        },
    ],
    outputFields: [
        {
            type: "file",
            name: "Video",
            fileExtensions: ["mp4"],
        },
    ],
    async run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult> {
        console.log("VideoMergeAudio run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const volume = param.node.properties?.data?.volume || 1.0;
                const loopAudio =
                    param.node.properties?.data?.loopAudio || false;
                const fadeInTime = param.node.properties?.data?.fadeInTime || 0;
                const fadeOutTime =
                    param.node.properties?.data?.fadeOutTime || 0;
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    audio: param.runInputs["Audio"],
                    title: param.node.properties?.title + "-" + param.node.id,
                    volume: volume,
                    loopAudio: loopAudio,
                    fadeInTime: fadeInTime,
                    fadeOutTime: fadeOutTime,
                };
                if (!taskRunData.video) {
                    throw "视频参数错误";
                }
                if (!taskRunData.audio) {
                    throw "音频参数错误";
                }
                return await VideoMergeAudioRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs["Video"] = data.video;
            },
        );
    },
    async check(node) {
        if (!node.properties?.data?.volume) {
            throw "请输入音量参数";
        }
        if (node.properties?.inputFields?.[0].value === "") {
            throw "请输入视频参数";
        }
        if (node.properties?.inputFields?.[1].value === "") {
            throw "请输入音频参数";
        }
    },
};
