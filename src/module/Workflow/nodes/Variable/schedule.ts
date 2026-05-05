import {
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    WorkflowSchedule,
} from "../../core/type";
import { resolveVariables } from "../../core/variable";

export default <WorkflowSchedule>{
    async run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult> {
        const result: NodeRunResult = {
            status: "error",
            statusMsg: "未知错误",
            runOutputs: {},
            runData: {},
        };
        const variables = param.node.properties.data?.variables;
        if (!variables || variables.length === 0) {
            return {
                status: "error",
                statusMsg: "变量路径未配置",
                runOutputs: {},
            };
        }
        const resultVariables: any = {};
        for (const variable of variables) {
            resultVariables[variable.name] = resolveVariables(
                variable.value,
                param.variables,
                "",
            );
        }
        result.status = "success";
        result.runData!.variables = resultVariables;
        return result;
    },
    async check(node) {
        // 检查逻辑，如果需要
    },
};
