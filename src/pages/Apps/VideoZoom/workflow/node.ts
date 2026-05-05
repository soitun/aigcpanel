import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoZoomRun } from "../task";
import AppIcon from "~icons/mdi/magnify";

export default <NodeFunctionCall>{
    name: "VideoZoom",
    title: "视频片段放大",
    description: "放大视频中的指定片段",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoZoomNode.vue")),
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
        console.log("VideoZoom run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    title: param.node.properties?.title + "-" + param.node.id,
                };
                if (!taskRunData.video) {
                    throw "参数错误：缺少视频文件";
                }
                return await VideoZoomRun(taskRunData);
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
    },
};
