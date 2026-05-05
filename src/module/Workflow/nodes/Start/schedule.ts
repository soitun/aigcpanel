import {
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    WorkflowSchedule,
} from "../../core/type";

export default <WorkflowSchedule>{
    async run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult> {
        return {
            status: "success",
            statusMsg: "",
            runOutputs: JSON.parse(JSON.stringify(param.runInputs)),
        };
    },
    async check(node) {},
};
