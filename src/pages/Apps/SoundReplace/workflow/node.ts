import {defineAsyncComponent} from "vue";
import {NodeFunctionCall, NodeRunController, NodeRunParam, NodeRunResult} from "../../../../module/Workflow/core/type";
import {SoundReplaceRun} from "../task";
import {t} from "../../../../lang";
import SoundReplaceIcon from "./../assets/icon.svg"
import {workflowRun} from "../../common/workflow";

export default <NodeFunctionCall>{
    name: "SoundReplace",
    title: t("声音替换"),
    icon: SoundReplaceIcon,
    comp: defineAsyncComponent(() => import("./SoundReplaceNode.vue")),
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
        {
            type: "file",
            name: "Srt",
            fileExtensions: ["srt"],
        }
    ],
    async run(controller: NodeRunController, param: NodeRunParam): Promise<NodeRunResult> {
        console.log('SoundReplace run', param);
        return workflowRun(
            controller, param,
            async () => {
                const taskRunData = {
                    taskId: param.runData?.['taskId'] || '',
                    video: param.runInputs['Video'],
                    title: param.node.properties?.title + '-' + param.node.id,
                    soundAsr: param.node.properties?.data?.soundAsr,
                    soundGenerate: param.node.properties?.data?.soundGenerate,
                };
                if (!taskRunData.video || !taskRunData.soundAsr || !taskRunData.soundGenerate) {
                    throw t("参数错误");
                }
                return await SoundReplaceRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs['Video'] = data.video
                result.runOutputs['Srt'] = data.srt
            }
        );
    },
    async check(node) {
        if (!node.properties?.data?.soundAsr || !node.properties?.data?.soundGenerate) {
            throw t("请配置声音识别和声音生成服务");
        }
        if (node.properties?.inputFields?.[0].value === '') {
            throw t("请输入视频参数");
        }
    }
}
