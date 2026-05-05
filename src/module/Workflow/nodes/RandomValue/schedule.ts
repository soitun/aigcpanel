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
        const result: NodeRunResult = {
            status: "error",
            statusMsg: "未知错误",
            runOutputs: {},
            runData: {},
        };
        const { values } = param.node.properties.data || {};
        if (!values || !Array.isArray(values) || values.length === 0) {
            result.statusMsg = "字符串列表未配置或为空";
            return result;
        }
        const randomIndex = Math.floor(Math.random() * values.length);
        const randomValue = values[randomIndex];
        result.runOutputs["Value"] = randomValue;
        result.statusMsg = "选择成功";
        result.status = "success";
        return result;
    },
    async check(node) {
        const { values } = node.properties.data || {};
        if (!values || !Array.isArray(values) || values.length === 0) {
            throw "字符串列表未配置或为空";
        }
    },
};
