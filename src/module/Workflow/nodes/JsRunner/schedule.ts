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
        const { code } = param.node.properties.data || {};
        if (!code) {
            result.statusMsg = "代码未配置";
            return result;
        }
        const inputData = param.runInputs["Value"];
        if (inputData === undefined) {
            result.statusMsg = "输入数据为空";
            return result;
        }
        try {
            let output;

            // 检查是否是完整的函数定义
            const trimmedCode = code.trim();
            if (
                trimmedCode.startsWith("function") ||
                trimmedCode.startsWith("async function")
            ) {
                // 完整的函数定义：创建函数并调用
                const func = new Function(
                    "input",
                    `return (${trimmedCode})(input);`,
                );
                output = func(inputData);
            } else {
                // 函数体：使用原有逻辑
                const func = new Function("input", code);
                output = func(inputData);
            }

            // 如果结果是Promise，等待它
            const finalOutput =
                output instanceof Promise ? await output : output;

            result.runOutputs["Value"] = finalOutput;
            result.statusMsg = "执行成功";
            result.status = "success";
        } catch (e) {
            result.statusMsg = "执行错误: " + (e as Error).message;
        }
        return result;
    },
    async check(node) {
        const { code } = node.properties.data || {};
        if (!code) {
            throw "代码未配置";
        }
        try {
            const trimmedCode = code.trim();
            if (
                trimmedCode.startsWith("function") ||
                trimmedCode.startsWith("async function")
            ) {
                // 验证完整的函数定义
                new Function("input", `return (${trimmedCode})(input);`);
            } else {
                // 验证函数体
                new Function("input", code);
            }
        } catch (e) {
            throw "代码语法错误: " + (e as Error).message;
        }
    },
};
