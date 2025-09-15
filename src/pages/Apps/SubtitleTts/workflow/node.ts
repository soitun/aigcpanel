import { defineAsyncComponent } from "vue";
import { t } from "../../../../lang";
import { NodeFunctionCall, NodeRunController, NodeRunParam, NodeRunResult } from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { SubtitleTtsRun } from "../task";
import SubtitleTtsIcon from "./../assets/icon.svg";

export default <NodeFunctionCall>{
    name: "SubtitleTts",
    title: t("字幕转音频"),
    description: "将字幕文件转换为音频文件",
    icon: SubtitleTtsIcon,
    comp: defineAsyncComponent(() => import("./SubtitleTtsNode.vue")),
    inputFields: [
        {
            type: "file",
            name: "Srt",
            fileExtensions: ["srt"],
        },
    ],
    outputFields: [
        {
            type: "file",
            name: "Audio",
            fileExtensions: ["mp3", "wav"],
        }
    ],
    async run(controller: NodeRunController, param: NodeRunParam): Promise<NodeRunResult> {
        console.log('SubtitleTts run', param);
        return workflowRun(
            controller, param,
            async () => {
                const taskRunData = {
                    taskId: param.runData?.['taskId'] || '',
                    srt: param.runInputs['Srt'],
                    title: param.node.properties?.title + '-' + param.node.id,
                    soundGenerate: param.node.properties?.data?.soundGenerate,
                };
                if (!taskRunData.srt || !taskRunData.soundGenerate) {
                    throw t("参数错误");
                }
                return await SubtitleTtsRun(taskRunData);
            },
            async (result, data) => {
                result.runOutputs['Audio'] = data.audio
            }
        );
    },
    async check(node) {
        if (!node.properties?.data?.soundGenerate) {
            throw t("请配置声音生成服务");
        }
        if (node.properties?.inputFields?.[0].value === '') {
            throw t("请输入字幕文件参数");
        }
    }
}
