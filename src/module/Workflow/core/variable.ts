import { getEditor } from "./global";

export const listAllVariables = (nodeId: string) => {
    const nodes = getEditor().graphModel.nodes;
    const edges = getEditor().graphModel.edges;
    const variables: {
        node: string;
        name: string;
    }[] = [];
    if ("start" === nodeId) {
        return variables;
    }
    const getParents = (id: string) => {
        const parents: string[] = [];
        const visited = new Set<string>();
        const queue = [id];
        const distance = new Map<string, number>();
        distance.set(id, 0);
        visited.add(id);

        while (queue.length > 0) {
            const current = queue.shift()!;
            edges.forEach((edge) => {
                if (
                    edge.targetNodeId === current &&
                    !visited.has(edge.sourceNodeId)
                ) {
                    visited.add(edge.sourceNodeId);
                    distance.set(edge.sourceNodeId, distance.get(current)! + 1);
                    queue.push(edge.sourceNodeId);
                }
            });
        }

        // 移除自身
        visited.delete(id);

        // 按距离排序，由近及远
        const sortedParents = Array.from(visited).sort(
            (a, b) => distance.get(a)! - distance.get(b)!,
        );
        return sortedParents;
    };
    const parentIds = getParents(nodeId);
    parentIds.forEach((id) => {
        const node = nodes.find((n) => n.id === id);
        if (node && node.properties) {
            // @ts-ignore
            if (node.type === "Variable") {
                // 全局变量节点，直接把变量名作为输出
                if (node.properties.runData?.variables) {
                    Object.keys(node.properties.runData.variables).forEach(
                        (varName: string) => {
                            variables.push({
                                node: "",
                                name: varName,
                            });
                        },
                    );
                }
            } else if (node.properties.outputFields) {
                node.properties.outputFields.forEach(
                    (field: { name: string }) => {
                        variables.push({
                            node: node.properties.title,
                            name: field.name,
                        });
                    },
                );
            }
        }
    });
    return variables;
};

// 解析变量表达式，支持中间变量格式，如：前缀${变量}后缀
function getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return current;
}

function resolveVariables(
    value: string | object,
    variables: Record<string, any>,
    defaultValue: string = "",
): string {
    console.log("resolveVariables", { value, variables, defaultValue });

    // 使用正则表达式匹配所有${...}格式的变量
    const replaceVariable = (value: string): string => {
        return value.replace(/\$\{([^}]+)\}/g, (_, varPath) => {
            const parts = varPath.split(".");
            if (parts.length === 1) {
                // 可能是全局变量，直接查找
                const varName = parts[0];
                if (variables[varName] !== undefined) {
                    if (typeof variables[varName] === "object") {
                        return JSON.stringify(variables[varName]);
                    }
                    return String(variables[varName]);
                } else {
                    return "";
                }
            }
            const sourceNodeTitle = parts[0];
            const fieldPath = parts.slice(1).join(".");
            if (sourceNodeTitle && fieldPath) {
                if (variables[sourceNodeTitle]) {
                    const sourceOutputs = variables[sourceNodeTitle];
                    const resolvedValue = getNestedValue(
                        sourceOutputs,
                        fieldPath,
                    );
                    if (resolvedValue !== undefined) {
                        if (typeof resolvedValue === "object") {
                            return JSON.stringify(resolvedValue);
                        }
                        return String(resolvedValue);
                    } else {
                        return "";
                    }
                } else {
                    return "";
                }
            } else {
                return "";
            }
        });
    };
    // 统一把 @RAW(...) 替换为 (...)，以支持传递原始JSON字符串，如果字符串里面有括号，需要考虑转义问题
    const toResultRaw = (input: string | object): any => {
        if (typeof input === "string") {
            // 匹配 @RAW(...) ，捕获里面的内容
            const rawRegex = /^@RAW\(([\s\S]*)\)$/;
            const match = input.match(rawRegex);
            if (match) {
                const inner = match[1];
                // 尝试解析成 JSON；解析失败就原样返回字符串
                try {
                    return JSON.parse(inner);
                } catch {
                    return inner;
                }
            }
            return input;
        } else if (Array.isArray(input)) {
            return input.map((item) => toResultRaw(item));
        } else if (input && typeof input === "object") {
            const res: any = {};
            for (const k in input) {
                res[k] = toResultRaw(input[k]);
            }
            return res;
        }
        return input;
    };

    const replaceVariableAll = (input: any): any => {
        if (typeof input === "string") {
            return replaceVariable(input);
        } else if (Array.isArray(input)) {
            return input.map((item) => replaceVariableAll(item));
        } else if (input && typeof input === "object") {
            const res: any = {};
            for (const k in input) {
                res[k] = replaceVariableAll(input[k]);
            }
            return res;
        }
        return input;
    };
    const result = replaceVariableAll(value);
    const resultRaw = toResultRaw(result);
    console.log("resolveVariables.result", { result, resultRaw });
    return resultRaw;
}

export { getNestedValue, resolveVariables };
