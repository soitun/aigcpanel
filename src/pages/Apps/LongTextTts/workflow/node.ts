import { defineAsyncComponent } from "vue";
import { t } from "../../../../lang";
import { NodeFunctionCall, NodeRunController, NodeRunParam, NodeRunResult } from "../../../../module/Workflow/core/type";
import { workflowRun } from "../../common/workflow";
import { LongTextTtsRun } from "../task";
import LongTextTtsIcon from "./../assets/icon.svg";

export default <NodeFunctionCall>{
    name: "LongTextTts",
    title: t("长文本转音频"),
    description: "将长文本转换为音频",
    icon: LongTextTtsIcon,
    comp: defineAsyncComponent(() => import("./LongTextTtsNode.vue")),
    inputFields: [
        {
            type: "text",
            name: "Text",
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
        console.log('LongTextTts run', param);
        return workflowRun(
            controller, param,
            async () => {
                const taskRunData = {
                    taskId: param.runData?.['taskId'] || '',
                    text: param.runInputs['Text'],
                    title: param.node.properties?.title + '-' + param.node.id,
                    soundGenerate: param.node.properties?.data?.soundGenerate,
                };
                if (!taskRunData.text || !taskRunData.soundGenerate) {
                    throw t("参数错误");
                }
                return await LongTextTtsRun(taskRunData);
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
            throw t("请输入长文本参数");
        }
    }
}
