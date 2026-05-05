import { defineAsyncComponent } from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
} from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { VideoQuickCutRun } from "../task";
import AppIcon from "~icons/mdi/content-cut";

export default <NodeFunctionCall>{
    name: "VideoQuickCut",
    title: "快速剪辑",
    description: "快速剪辑视频",
    icon: AppIcon,
    comp: defineAsyncComponent(() => import("./VideoQuickCutNode.vue")),
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
        console.log("VideoQuickCut run", param);
        return workflowRun(
            controller,
            param,
            async () => {
                const soundAsr = param.node.properties?.data?.soundAsr;
                const taskRunData = {
                    taskId: param.runData?.["taskId"] || "",
                    video: param.runInputs["Video"],
                    title: param.node.properties?.title + "-" + param.node.id,
                    soundAsr: soundAsr,
                };
                if (!taskRunData.video) {
                    throw "参数错误：缺少视频文件";
                }
                if (!taskRunData.soundAsr) {
                    throw "请配置语音识别参数";
                }
                return await VideoQuickCutRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs["Video"] = data.video;
            },
        );
    },
    async check(node) {
        if (!node.properties?.data?.soundAsr) {
            throw "请配置语音识别参数";
        }
        if (node.properties?.inputFields?.[0].value === "") {
            throw "请输入视频参数";
        }
    },
};
