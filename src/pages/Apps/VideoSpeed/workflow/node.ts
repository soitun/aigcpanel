import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoSpeedRun } from "../task";
import AppIcon from "~icons/mdi/speedometer";

export default <NodeFunctionCall>{
    name: "VideoSpeed",
    title: "视频全局变速",
    description: "改变视频的播放速度",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoSpeedNode.vue")),
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
        console.log("VideoSpeed run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    title: param.node.properties?.title + "-" + param.node.id,
                    speed: param.node.properties?.data?.speed || 1.0,
                };
                if (!taskRunData.video) {
                    throw "参数错误：缺少视频文件";
                }
                return await VideoSpeedRun(taskRunData);
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
