import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoSubtitleRun } from "../task";
import AppIcon from "~icons/mdi/subtitles-outline";

export default <NodeFunctionCall>{
    name: "VideoSubtitle",
    title: "视频添加字幕",
    description: "为视频添加字幕",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoSubtitleNode.vue")),
    inputFields: [
        {
            type: "file",
            name: "Video",
            fileExtensions: ["mp4"],
        },
        {
            type: "file",
            name: "Subtitle",
            fileExtensions: ["srt"],
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
        console.log("VideoSubtitle run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    subtitle: param.runInputs["Subtitle"],
                    title: param.node.properties?.title + "-" + param.node.id,
                };
                if (!taskRunData.video || !taskRunData.subtitle) {
                    const missing: string[] = [];
                    if (!taskRunData.video) missing.push("视频");
                    if (!taskRunData.subtitle) missing.push("字幕");
                    throw `参数错误：缺少 ${missing.join(", ")}`;
                }
                return await VideoSubtitleRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs["Video"] = data.video;
            },
        );
    },
    async check(node) {
        if (node.properties?.inputFields?.[0].value === "") {
            throw "请输入视频参数";
        }
        if (node.properties?.inputFields?.[1].value === "") {
            throw "请输入字幕参数";
        }
    },
};
