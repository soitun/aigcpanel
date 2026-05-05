import {
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    WorkflowSchedule,
} from "../../core/type";
import { FunctionCallNodes } from "../../../../pages/Workflow/lib";

export default <WorkflowSchedule>{
    async run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult> {
        const node = FunctionCallNodes.find(
            (n) => n.name === param.node.properties.functionCallName,
        );
        if (!node) {
            return {
                status: "error",
                statusMsg: `Function call node ${param.node.properties.functionCallName} not found`,
                runOutputs: {},
            };
        }
        return node.run(controller, param);
    },
    async check(node) {},
};
