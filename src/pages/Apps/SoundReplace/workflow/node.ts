import {defineAsyncComponent} from "vue";
import {
    NodeFunctionCall,
    NodeRunParam,
    NodeRunResult,
    NodeRunResultStatus
} from "../../../../module/Workflow/core/type";

export default <NodeFunctionCall>{
    name: "SoundReplace",
    title: "声音替换",
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
    async run(param: NodeRunParam): Promise<NodeRunResult> {
        let status: NodeRunResultStatus = 'success';
        let statusMsg = '';
        const runOutputs = {};
        const runData = {};

        await new Promise((resolve) => setTimeout(resolve, 2000));
        runOutputs['VideoResult'] = Math.random().toString() + '' + param.node.id + '|' + param.runInputs['Video']
        runData['taskId'] = 8;
        if (Math.random() > 0.5) {
            status = 'pause';
            delete runData['taskId'];
        }

        return {
            status, statusMsg, runOutputs, runData,
        }
    },
    async check(node) {

    }
}
