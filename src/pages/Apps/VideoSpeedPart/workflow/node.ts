import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoSpeedPartRun } from "../task";
import AppIcon from "~icons/mdi/fast-forward";

export default <NodeFunctionCall>{
    name: "VideoSpeedPart",
    title: "视频片段变速",
    description: "改变视频片段的播放速度",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoSpeedPartNode.vue")),
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
        console.log("VideoSpeedPart run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const speed = param.node.properties?.data?.speed || 5;
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    speed: speed,
                    title: param.node.properties?.title + "-" + param.node.id,
                };
                if (!taskRunData.video) {
                    throw "参数错误：缺少视频文件";
                }
                return await VideoSpeedPartRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs["Video"] = data.video;
            },
        );
    },
    async check(node) {
        if (!node.properties?.data?.speed) {
            throw "请输入变速参数";
        }
        if (node.properties?.inputFields?.[0].value === "") {
            throw "请输入视频参数";
        }
    },
};
