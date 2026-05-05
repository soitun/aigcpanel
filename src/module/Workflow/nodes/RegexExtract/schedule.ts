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
        const { regex } = param.node.properties.data || {};
        if (!regex) {
            result.statusMsg = "正则表达式未配置";
            return result;
        }
        const inputText = param.runInputs["Value"];
        if (!inputText) {
            result.statusMsg = "输入文本为空";
            return result;
        }
        try {
            const reg = new RegExp(regex);
            const matches = inputText.match(reg);
            if (matches) {
                result.runOutputs["Value"] = matches[1] || "";
            } else {
                result.runOutputs["Value"] = "";
            }
            result.statusMsg = "提取成功";
            result.status = "success";
        } catch (e) {
            result.statusMsg = "正则表达式错误: " + (e as Error).message;
        }
        return result;
    },
    async check(node) {
        const { regex } = node.properties.data || {};
        if (!regex) {
            throw "正则表达式未配置";
        }
        try {
            new RegExp(regex);
        } catch (e) {
            throw "正则表达式无效: " + (e as Error).message;
        }
    },
};
