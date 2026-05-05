import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoSizeConvertRun } from "../task";
import AppIcon from "~icons/mdi/aspect-ratio";

export default <NodeFunctionCall>{
    name: "VideoSizeConvert",
    title: "视频尺寸转换",
    description: "转换视频的尺寸",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoSizeConvertNode.vue")),
    inputFields: [
        {
            type: "file",
            name: "Video",
            fileExtensions: ["mp4"],
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
        console.log("VideoSizeConvert run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const targetWidth =
                    param.node.properties?.data?.targetWidth || 1920;
                const targetHeight =
                    param.node.properties?.data?.targetHeight || 1080;
                const fillMode =
                    param.node.properties?.data?.fillMode || "black";
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    title: param.node.properties?.title + "-" + param.node.id,
                    targetWidth: targetWidth,
                    targetHeight: targetHeight,
                    fillMode: fillMode,
                };
                if (!taskRunData.video) {
                    throw "参数错误：缺少视频文件";
                }
                return await VideoSizeConvertRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs["Video"] = data.video;
            },
        );
    },
    async check(node) {
        if (
            !node.properties?.data?.targetWidth ||
            !node.properties?.data?.targetHeight
        ) {
            throw "请输入尺寸参数";
        }
        if (node.properties?.inputFields?.[0].value === "") {
            throw "请输入视频参数";
        }
    },
};
