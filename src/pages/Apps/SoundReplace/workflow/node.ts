import {defineAsyncComponent} from "vue";
import {
    NodeFunctionCall,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    NodeRunResultStatus
} from "../../../../module/Workflow/core/type";
import {SoundReplaceRun} from "../task";
import {t} from "../../../../lang";

export default <NodeFunctionCall>{
    name: "SoundReplace",
    title: t("声音替换"),
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
            name: "VideoResult",
            fileExtensions: ["mp4"],
        }
    ],
    async run(controller: NodeRunController, param: NodeRunParam): Promise<NodeRunResult> {
        console.log('SoundReplace run', param);
        const result: NodeRunResult = {
            status: 'error' as NodeRunResultStatus,
            statusMsg: t("未知错误"),
            runOutputs: {},
            runData: {},
            pauseByType: '',
            pauseById: '',
        }
        const taskRunData = {
            taskId: param.runData?.['taskId'] || '',
            video: param.runInputs['Video'],
            title: 'Workflow-' + param.node.id,
            soundAsr: param.node.properties?.data?.soundAsr,
            soundGenerate: param.node.properties?.data?.soundGenerate,
        };
        if (!taskRunData.video || !taskRunData.soundAsr || !taskRunData.soundGenerate) {
            throw t("参数错误");
        }
        const res = await SoundReplaceRun(taskRunData);
        result.runData!['taskId'] = res.taskId;
        controller.updateNodeRunData(param.node.id, result.runData)
        const taskResult = await res.result();
        if (taskResult.code) {
            result.status = 'error';
            result.statusMsg = taskResult.msg || t("任务失败");
        } else if (taskResult.data?.status === 'success') {
            result.status = 'success';
            result.runOutputs['VideoResult'] = taskResult.data.video
        } else if (taskResult.data?.status === 'pause') {
            result.status = 'pause';
            result.pauseByType = 'task';
            result.pauseById = res.taskId;
        } else {
            result.status = 'error';
            result.statusMsg = taskResult.msg || t("任务失败");
        }
        return result
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
