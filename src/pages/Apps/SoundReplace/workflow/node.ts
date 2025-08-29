import {defineAsyncComponent} from "vue";
import {NodeFunctionCall, NodeRunParam, NodeRunResult} from "../../../../module/Workflow/core/type";

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
        const runOutputs = {};
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runOutputs['VideoResult'] = Math.random().toString() + '' + param.node.id + '|' + param.runInputs['Video']
        return {
            status: Math.random() > 0.5 ? 'pause' : 'success',
            statusMsg: '',
            runOutputs: runOutputs,
        }
    },
    async check(node) {

    }
}
