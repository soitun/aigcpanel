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
        // console.log('IfElse.run', {param});
        const result: NodeRunResult = {
            status: "error",
            statusMsg: "未知错误",
            runOutputs: {},
            runData: {},
        };
        const data = param.node.properties.data || {};
        const { type } = data;
        if (!type) {
            result.statusMsg = "类型未配置";
            return result;
        }
        result.runData!["Next"] = null;
        try {
            let conditionResult: boolean;
            if (type === "simple") {
                const { value1, operator, value2, ignoreCase } = data;
                const resolvedValue1 = resolveVariables(
                    value1,
                    param.variables,
                    "",
                );
                const resolvedValue2 = resolveVariables(
                    value2,
                    param.variables,
                    "",
                );
                // console.log('IfElse.run', {value1, resolvedValue1, operator, value2, resolvedValue2});
                if (
                    resolvedValue1 === undefined ||
                    operator === undefined ||
                    resolvedValue2 === undefined
                ) {
                    result.statusMsg = "简单条件配置不完整";
                    result.statusMsg = "简单条件配置不完整";
                    return result;
                }
                // 简单比较
                let str1 = String(resolvedValue1);
                let str2 = String(resolvedValue2);
                if (ignoreCase) {
                    str1 = str1.toLowerCase();
                    str2 = str2.toLowerCase();
                }
                switch (operator) {
                    case "==":
                        conditionResult = resolvedValue1 == resolvedValue2;
                        break;
                    case "===":
                        conditionResult = resolvedValue1 === resolvedValue2;
                        break;
                    case "!=":
                        conditionResult = resolvedValue1 != resolvedValue2;
                        break;
                    case "!==":
                        conditionResult = resolvedValue1 !== resolvedValue2;
                        break;
                    case ">":
                        conditionResult = resolvedValue1 > resolvedValue2;
                        break;
                    case "<":
                        conditionResult = resolvedValue1 < resolvedValue2;
                        break;
                    case ">=":
                        conditionResult = resolvedValue1 >= resolvedValue2;
                        break;
                    case "<=":
                        conditionResult = resolvedValue1 <= resolvedValue2;
                        break;
                    case "contains":
                        conditionResult = str1.includes(str2);
                        break;
                    case "not_contains":
                        conditionResult = !str1.includes(str2);
                        break;
                    case "starts_with":
                        conditionResult = str1.startsWith(str2);
                        break;
                    case "ends_with":
                        conditionResult = str1.endsWith(str2);
                        break;
                    default:
                        result.statusMsg = "不支持的操作符: " + operator;
                        return result;
                }
                result.runData!["Next"] = conditionResult
                    ? "output_default"
                    : "output_else";
            } else if (type === "code") {
                const { code } = data;
                const resolvedCode = resolveVariables(
                    code,
                    param.variables,
                    code,
                );
                if (!resolvedCode) {
                    result.statusMsg = "代码未配置";
                    return result;
                }
                // 执行代码
                const inputData = {};
                const trimmedCode = resolvedCode.trim();
                let output = null;
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
                    const func = new Function("input", resolvedCode);
                    output = func(inputData);
                }
                const finalOutput: any =
                    (output as any) instanceof Promise ? await output : output;
                if (finalOutput) {
                    result.runData!["Next"] = "output_default";
                } else {
                    result.runData!["Next"] = "output_else";
                }
            } else {
                result.statusMsg = "未知类型: " + type;
                return result;
            }
            result.statusMsg = "执行成功";
            result.status = "success";
        } catch (e) {
            result.statusMsg = "执行错误: " + (e as Error).message;
        }
        return result;
    },
    async check(node) {
        const data = node.properties.data || {};
        const { type } = data;
        if (!type) {
            throw "类型未配置";
        }
        if (type === "simple") {
            const { value1, operator, value2 } = data;
            if (
                value1 === undefined ||
                operator === undefined ||
                value2 === undefined
            ) {
                throw "简单条件配置不完整";
            }
            const validOperators = [
                "==",
                "===",
                "!=",
                "!==",
                ">",
                "<",
                ">=",
                "<=",
                "contains",
                "not_contains",
                "starts_with",
                "ends_with",
            ];
            if (!validOperators.includes(operator)) {
                throw "不支持的操作符: " + operator;
            }
        } else if (type === "code") {
            const { code } = data;
            if (!code) {
                throw "代码未配置";
            }
            try {
                new Function("input", `return ${code};`);
            } catch (e) {
                throw "代码语法错误: " + (e as Error).message;
            }
        } else {
            throw "未知类型: " + type;
        }
    },
};
