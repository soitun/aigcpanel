import { t } from "../../../lang";
import {
    NodeProperties,
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    NodeStatus,
    WorkflowData,
    WorkflowNode,
    WorkflowSchedule,
    WorkflowStatus,
} from "../core/type";
import { resolveVariables } from "../core/variable";

// 动态导入所有节点的schedule
const schedules: any = import.meta.glob("../nodes/**/schedule.ts", {
    eager: true,
});
const scheduleMap: Map<string, WorkflowSchedule> = new Map();

for (const [path, module] of Object.entries(schedules)) {
    const type = path.split("/").slice(-2)[0]; // 提取节点类型，如 'Start', 'FunctionCall'
    scheduleMap.set(type, (module as any).default);
}

function deepMergeVariables(
    target: Record<string, any>,
    source: Record<string, any>,
) {
    for (const key in source) {
        const obj = source[key];
        if (typeof obj === "object" && !Array.isArray(obj) && obj !== null) {
            if (!target[key]) target[key] = {};
            deepMergeVariables(target[key], obj);
        } else {
            target[key] = obj;
        }
    }
}

function assignVariables(
    target: Record<string, any>,
    source: Record<string, any>,
) {
    for (const key in source) {
        const pcs = key.split(".");
        if (pcs.length === 2) {
            if (!target[pcs[0]]) target[pcs[0]] = {};
            target[pcs[0]][pcs[1]] = source[key];
        } else {
            target[key] = source[key];
        }
    }
}

function updateRunRuntimeVariables(node: WorkflowNode) {
    const nodeTitle = node.properties.title;
    if (node.type === "Variable") {
        console.log(
            `engine.run.updateRunRuntimeVariables.${node.id}.${nodeTitle}`,
            JSON.parse(
                JSON.stringify({
                    variables: node.properties.runData!.variables,
                }),
            ),
        );
        assignVariables(
            node.properties.runRuntime!.variables,
            node.properties.runData?.variables,
        );
    } else {
        console.log(
            `engine.run.updateRunRuntimeVariables.${node.id}.${nodeTitle}`,
            JSON.parse(
                JSON.stringify({
                    runOutputs: node.properties.runOutputs,
                }),
            ),
        );
        const vars = {};
        for (const k in node.properties.runOutputs) {
            vars[`${nodeTitle}.${k}`] = node.properties.runOutputs[k];
        }
        assignVariables(node.properties.runRuntime!.variables, vars);
    }
}

// 校验workflow图
export async function workflowCheck(
    data: WorkflowData,
): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. 检查是否有Start节点
    const startNodes = data.nodes.filter((node) => node.type === "Start");
    if (startNodes.length === 0) {
        errors.push(t("工作流必须至少有一个 Start 节点"));
    } else if (startNodes.length > 1) {
        errors.push(t("工作流只能有一个 Start 节点"));
    }

    // 获取从Start节点可达的节点
    const reachableNodeIds = new Set<string>();
    if (startNodes.length === 1) {
        const startNodeId = startNodes[0].id;
        reachableNodeIds.add(startNodeId);
        const graph = buildGraph(data);
        const visited = new Set<string>();
        const queue = [startNodeId];
        visited.add(startNodeId);

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            for (const neighbor of graph.get(nodeId) || []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                    reachableNodeIds.add(neighbor);
                }
            }
        }
    }

    // 2. 检查循环依赖（只检查可达的节点）
    const graph = buildGraph(data);
    const reachableGraph = new Map<string, string[]>();
    reachableNodeIds.forEach((nodeId) => {
        reachableGraph.set(nodeId, graph.get(nodeId) || []);
    });
    if (hasCycle(reachableGraph)) {
        errors.push(t("工作流包含循环"));
    }

    // 3. 检查每个可达节点的schedule是否存在
    for (const node of data.nodes) {
        if (reachableNodeIds.has(node.id)) {
            if (!scheduleMap.has(node.type)) {
                errors.push(
                    t("未找到节点类型 {type} 的调度器", { type: node.type }),
                );
            } else {
                const schedule = scheduleMap.get(node.type);
                if (schedule?.check) {
                    try {
                        await schedule?.check(node);
                    } catch (error) {
                        errors.push(
                            t(`节点 {title} 检查失败: {error}`, {
                                title: node.properties.title,
                                error: String(error),
                            }),
                        );
                    }
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

export function workflowExecute(
    data: WorkflowData,
    options?: {
        isContinue?: boolean;
        stopNodeId?: string;
        onNodeStatusChange?: (
            data: WorkflowData,
            nodeId: string,
            status: NodeStatus,
            statusMsg?: string,
        ) => void;
        onNodeDataChange?: (
            data: WorkflowData,
            nodeId: string,
            properties: Partial<{
                runInputs: NodeProperties["runInputs"];
                runOutputs: NodeProperties["runOutputs"];
                runData: NodeProperties["runData"];
                data: NodeProperties["data"];
            }>,
        ) => void;
        onNodeStart?: (
            data: WorkflowData,
            nodeId: string,
            param: NodeRunParam,
        ) => void;
        onNodeFinish?: (
            data: WorkflowData,
            nodeId: string,
            result: NodeRunResult,
        ) => void;
        onStatusChange?: (
            data: WorkflowData,
            status: WorkflowStatus,
            statusMsg?: string,
        ) => void;
        onFinish?: (
            data: WorkflowData,
            success: boolean,
            errors: string[],
            results: Map<string, NodeRunResult>,
        ) => void;
        onLog?: (
            data: WorkflowData,
            level: "info" | "warn" | "error",
            message: string,
        ) => void;
    },
): {
    cancel: () => void;
    result: () => Promise<{
        success: boolean;
        errors: string[];
        results: Map<string, NodeRunResult>;
    }>;
} {
    const controller = new AbortController();
    const signal = controller.signal;

    const result = async (): Promise<{
        success: boolean;
        errors: string[];
        results: Map<string, NodeRunResult>;
    }> => {
        const errors: string[] = [];
        const results = new Map<string, NodeRunResult>();

        const defaultOptions = {
            isContinue: false,
            stopNodeId: undefined,

            onNodeStatusChange: (
                data: WorkflowData,
                nodeId: string,
                status: NodeStatus,
                statusMsg?: string,
            ) => {
                const node = data.nodes.find((n) => n.id === nodeId);
                const nodeTitle = node ? node.properties.title : nodeId;
                console.log(
                    `[NodeStatusChange] 节点 ${nodeTitle} 状态更改为 ${status}: ${statusMsg}`,
                );
            },
            onNodeDataChange: (
                data: WorkflowData,
                nodeId: string,
                properties: Partial<{
                    runInputs: NodeProperties["runInputs"];
                    runOutputs: NodeProperties["runOutputs"];
                    runData: NodeProperties["runData"];
                    data: NodeProperties["data"];
                }>,
            ) => {
                const node = data.nodes.find((n) => n.id === nodeId);
                const nodeTitle = node ? node.properties.title : nodeId;
                console.log(
                    `[NodeDataChange] 节点 ${nodeTitle} 属性更新: ${JSON.stringify(properties)}`,
                );
            },
            onNodeStart: (
                data: WorkflowData,
                nodeId: string,
                param: NodeRunParam,
            ) => {
                console.log(
                    `[NodeStart] 节点 ${param.node.properties.title} 开始执行，输入: ${JSON.stringify(param.runInputs)}`,
                );
            },
            onNodeFinish: (
                data: WorkflowData,
                nodeId: string,
                result: NodeRunResult,
            ) => {
                const node = data.nodes.find((n) => n.id === nodeId);
                const nodeTitle = node ? node.properties.title : nodeId;
                console.log(
                    `[NodeFinish] 节点 ${nodeTitle} 执行完成，状态: ${result.status}`,
                );
            },
            onStatusChange: (
                data: WorkflowData,
                status: WorkflowStatus,
                statusMsg?: string,
            ) => {
                console.log(
                    `[WorkflowStatusChange] 工作流状态更改为 ${status}: ${statusMsg}`,
                );
            },
            onFinish: (
                data: WorkflowData,
                success: boolean,
                errors: string[],
                results: Map<string, NodeRunResult>,
            ) => {
                console.log(
                    `[Finish] 工作流执行完成，成功: ${success}, 错误数: ${errors.length}, 结果数: ${results.size}`,
                );
            },
            onLog: (
                data: WorkflowData,
                level: "info" | "warn" | "error" = "info",
                message: string,
            ) => {
                console.log(`[${level.toUpperCase()}] ${message}`);
            },
        };

        const finalOptions = Object.assign(defaultOptions, options);
        // 设置workflow状态为running
        data.status = "running";
        finalOptions.onLog!(
            data,
            "info",
            `工作流执行开始${finalOptions.isContinue ? "（恢复模式）" : ""}`,
        );
        finalOptions.onStatusChange!(data, "running", "");

        // 获取从Start节点可达的节点
        const startNodes = data.nodes.filter((node) => node.type === "Start");
        const reachableNodeIds = new Set<string>();
        if (startNodes.length === 1) {
            const startNodeId = startNodes[0].id;
            reachableNodeIds.add(startNodeId);
            const graph = buildGraph(data);
            const visited = new Set<string>();
            const queue = [startNodeId];
            visited.add(startNodeId);

            while (queue.length > 0) {
                const nodeId = queue.shift()!;
                for (const neighbor of graph.get(nodeId) || []) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                        reachableNodeIds.add(neighbor);
                    }
                }
            }
        }

        // 如果指定了stopNodeId，只执行上游路径上的节点
        let executableNodeIds = reachableNodeIds;
        if (finalOptions.stopNodeId) {
            const upstreamNodes = getUpstreamNodes(
                data,
                finalOptions.stopNodeId,
            );
            executableNodeIds = new Set(
                [...reachableNodeIds].filter((id) => upstreamNodes.has(id)),
            );
        }

        console.log("engine.run.executableNodeIds", executableNodeIds);

        // 如果是恢复模式，清除之前的错误和结果，准备重新执行
        if (finalOptions.isContinue) {
            errors.length = 0; // 清除之前的错误
            results.clear(); // 清除之前的结果，重新收集
            finalOptions.onLog!(
                data,
                "info",
                `恢复模式：清除之前的错误和结果，准备重新执行`,
            );
            data.nodes.forEach((node) => {
                if (reachableNodeIds.has(node.id)) {
                    // set error to idle
                    // if (node.properties.status === "error") {
                    //     node.properties.status = 'idle';
                    //     node.properties.statusMsg = '';
                    // }
                    finalOptions.onNodeStatusChange!(
                        data,
                        node.id,
                        node.properties.status,
                        node.properties.statusMsg,
                    );
                }
            });
        } else {
            // 非恢复模式，重置可达节点状态
            data.nodes.forEach((node) => {
                if (executableNodeIds.has(node.id)) {
                    node.properties.status = "idle";
                    node.properties.statusMsg = "";
                    node.properties.runInputs = {};
                    node.properties.runOutputs = {};
                    node.properties.runData = {};
                    finalOptions.onNodeStatusChange!(data, node.id, "idle", "");
                    finalOptions.onNodeDataChange!(data, node.id, {
                        runInputs: {},
                        runOutputs: {},
                        runData: {},
                    });
                }
            });
            finalOptions.onLog!(data, "info", `非恢复模式：重置可达节点状态`);
        }

        // 动态执行，使用队列支持条件分支
        const queue: string[] = [];
        const nodeTryRunTimes: Map<string, number> = new Map(); // 记录节点尝试执行的次数
        const processed = new Set<string>(); // 是否已标记处理，防止重复入队
        const executed = new Set<string>(); // 记录已执行的节点
        // 节点的输出，key是节点ID
        const nodeOutputs: Map<string, Record<string, any>> = new Map();
        // 每个节点的variables快照，key是节点ID
        const variablesMap: Map<string, Record<string, any>> = new Map();

        function getNodeVariables(nodeId: string): Record<string, any> {
            if (variablesMap.has(nodeId)) {
                return variablesMap.get(nodeId)!;
            }
            const vars: Record<string, any> = {};
            // start node
            if (data.nodes.find((n) => n.id === nodeId)?.type === "Start") {
                variablesMap.set(nodeId, vars);
                return vars;
            }
            // other node , dynamic build from upstream nodes
            const upstreamNodes = getParentNodes(data, nodeId);
            for (const upNodeId of upstreamNodes) {
                const upVars = getNodeVariables(upNodeId);
                deepMergeVariables(vars, upVars);
            }
            variablesMap.set(nodeId, vars);
            return vars;
        }

        // 初始化队列，从Start节点开始
        if (startNodes.length === 1) {
            const startNodeId = startNodes[0].id;
            if (executableNodeIds.has(startNodeId)) {
                queue.push(startNodeId);
                processed.add(startNodeId);
            }
        }

        // 如果是恢复模式，恢复已成功的节点的输出，并找出可以执行的节点
        if (finalOptions.isContinue) {
            data.nodes.forEach((node) => {
                if (
                    (node.properties.status === "success" ||
                        node.properties.status === "success_ignore") &&
                    node.properties.runOutputs &&
                    executableNodeIds.has(node.id)
                ) {
                    nodeOutputs.set(node.id, node.properties.runOutputs);
                }
            });
            finalOptions.onLog!(
                data,
                "info",
                `恢复模式：已执行节点数 ${processed.size - queue.length}，待执行节点数 ${queue.length}`,
            );
        }

        finalOptions.onLog!(data, "info", `开始动态执行工作流`);

        // 检查是否已被取消
        if (signal.aborted) {
            const cancelMsg = t("用户手动取消");
            data.status = "error";
            finalOptions.onLog!(data, "warn", cancelMsg);
            finalOptions.onStatusChange!(data, "error", cancelMsg);
            finalOptions.onFinish!(data, false, [cancelMsg], results);
            return { success: false, errors: [cancelMsg], results };
        }

        const calcNextNode = (node: WorkflowNode) => {
            // const activatedHandles = getActivatedHandles(node, node.properties.runData || {});
            const activatedHandles =
                node.properties.outputs?.map((o) => o.id) || [];
            const allOutputHandles =
                node.properties.outputs?.map((o) => o.id) || [];
            // const deactivatedHandles = allOutputHandles.filter(handle => !activatedHandles.includes(handle));
            // console.log('engine.calcNextNode', {
            //     nodeId: node.id,
            //     title: node.properties.title,
            //     activatedHandles,
            //     allOutputHandles,
            //     deactivatedHandles
            // });

            // 处理激活的分支
            for (const handle of activatedHandles) {
                const outgoingEdges = data.edges.filter(
                    (edge) =>
                        edge.sourceNodeId === node.id &&
                        edge.sourceAnchorId === handle,
                );
                for (const edge of outgoingEdges) {
                    const targetNodeId = edge.targetNodeId;
                    console.log("engine.calcNextNode.test", {
                        from: node.id,
                        to: targetNodeId,
                        executable: executableNodeIds.has(targetNodeId!),
                        executed: processed.has(targetNodeId!),
                        handle,
                        edge,
                    });
                    if (
                        targetNodeId &&
                        executableNodeIds.has(targetNodeId) &&
                        !processed.has(targetNodeId)
                    ) {
                        queue.push(targetNodeId);
                        processed.add(targetNodeId);
                        console.log("engine.calcNextNode.enqueue", {
                            targetNodeId,
                            queueLength: queue.length,
                        });
                    }
                }
            }

            // 处理未激活的分支，标记为 success_ignore
            // for (const handle of deactivatedHandles) {
            //     const outgoingEdges = data.edges.filter(edge => edge.sourceNodeId === node.id && edge.sourceAnchorId === handle);
            //     for (const edge of outgoingEdges) {
            //         if (edge.targetNodeId && executableNodeIds.has(edge.targetNodeId)) {
            //             markBranchAsIgnored(edge.targetNodeId);
            //         }
            //     }
            // }
        };

        // 标记分支上的节点为 success_ignore
        // const markBranchAsIgnored = (nodeId: string) => {
        //     if (processed.has(nodeId)) return;
        //
        //     const node = data.nodes.find(n => n.id === nodeId);
        //     if (!node) return;
        //
        //     // 标记为 success_ignore
        //     node.properties.status = "success_ignore";
        //     node.properties.statusMsg = t("条件分支未激活");
        //     finalOptions.onNodeStatusChange!(data, nodeId, "success_ignore", t("条件分支未激活"));
        //
        //     // 创建 success_ignore 结果
        //     const ignoreResult: NodeRunResult = {
        //         status: "success_ignore",
        //         statusMsg: t("条件分支未激活"),
        //         runOutputs: {},
        //         runData: {}
        //     };
        //     results.set(nodeId, ignoreResult);
        //     finalOptions.onNodeFinish!(data, nodeId, ignoreResult);
        //
        //     // 注意：不添加到executed，因为被忽略的节点没有执行
        // }

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            const node = data.nodes.find((n) => n.id === nodeId);
            if (!node) continue;
            const nodeTitle = node ? node.properties.title : nodeId;

            node.properties.runRuntime = {
                variables: {},
            };

            // 检查上游状态，如果所有上游都是 success_ignore，则标记为 success_ignore 并跳过执行
            const execStatus = getNodeExecutionStatus(data, nodeId, executed);
            console.log(
                `engine.run.${nodeId}.${nodeTitle}`,
                JSON.parse(
                    JSON.stringify({
                        execStatus,
                        queueLength: queue.length,
                        tryTimes: nodeTryRunTimes.get(nodeId),
                    }),
                ),
            );
            if (execStatus.shouldIgnore) {
                node.properties.status = "success_ignore";
                node.properties.statusMsg = t("上游条件分支未激活");
                finalOptions.onNodeStatusChange!(
                    data,
                    nodeId,
                    "success_ignore",
                    t("上游条件分支未激活"),
                );
                const ignoreResult: NodeRunResult = {
                    status: "success_ignore",
                    statusMsg: t("上游条件分支未激活"),
                    runOutputs: {},
                    runData: {},
                };
                node.properties.runRuntime.variables = getNodeVariables(nodeId);
                results.set(nodeId, ignoreResult);
                finalOptions.onNodeFinish!(data, nodeId, ignoreResult);
                executed.add(nodeId);
                calcNextNode(node);
                continue;
            }
            if (!execStatus.canExecute) {
                // console.log('engine.run.skip', {
                //     nodeId,
                //     title: node.properties.title,
                //     reason: '上游节点未准备好，跳过等待',
                //     queueLength: queue.length
                // });
                if (queue.length > 0) {
                    nodeTryRunTimes.set(
                        nodeId,
                        (nodeTryRunTimes.get(nodeId) || 0) + 1,
                    );
                    if (
                        (nodeTryRunTimes.get(nodeId) || 0) > data.nodes.length
                    ) {
                        // 尝试多次后仍无法执行，判定为错误，防止死循环
                        node.properties.status = "error";
                        node.properties.statusMsg =
                            t("上游节点状态异常，无法执行");
                        finalOptions.onNodeStatusChange!(
                            data,
                            nodeId,
                            "error",
                            node.properties.statusMsg,
                        );
                        errors.push(
                            t(`节点 {title}: {error}`, {
                                title: node.properties.title,
                                error: node.properties.statusMsg,
                            }),
                        );
                        data.status = "error";
                        finalOptions.onStatusChange!(
                            data,
                            "error",
                            node.properties.statusMsg,
                        );
                        finalOptions.onLog!(
                            data,
                            "error",
                            `节点 ${node.properties.title} 无法执行，可能是上游节点状态异常`,
                        );
                        finalOptions.onFinish!(data, false, errors, results);
                        return {
                            success: false,
                            errors: [
                                t(
                                    "节点 {title} 无法执行，可能是上游节点状态异常",
                                    { title: node.properties.title },
                                ),
                            ],
                            results,
                        };
                    }
                    queue.push(nodeId);
                    continue;
                }
                node.properties.status = "error";
                node.properties.statusMsg = t("上游节点未成功，无法执行");
                finalOptions.onNodeStatusChange!(
                    data,
                    nodeId,
                    "error",
                    node.properties.statusMsg,
                );
                errors.push(
                    t(`节点 {title}: {error}`, {
                        title: node.properties.title,
                        error: node.properties.statusMsg,
                    }),
                );
                data.status = "error";
                finalOptions.onStatusChange!(
                    data,
                    "error",
                    node.properties.statusMsg,
                );
                finalOptions.onLog!(
                    data,
                    "error",
                    `节点 ${node.properties.title} 无法执行，可能是上游节点未成功`,
                );
                finalOptions.onFinish!(data, false, errors, results);
                return {
                    success: false,
                    errors: [
                        t("节点 {title} 无法执行，可能是上游节点未成功", {
                            title: node.properties.title,
                        }),
                    ],
                    results,
                };
            }

            // 检查是否已被取消
            if (signal.aborted) {
                const cancelMsg = t("用户手动取消");
                data.status = "error";
                node.properties.status = "error";
                node.properties.statusMsg = cancelMsg;
                finalOptions.onNodeStatusChange!(
                    data,
                    node.id,
                    "error",
                    cancelMsg,
                );
                finalOptions.onLog!(data, "warn", cancelMsg);
                finalOptions.onStatusChange!(data, "error", cancelMsg);
                finalOptions.onFinish!(data, false, [cancelMsg], results);
                return { success: false, errors: [cancelMsg], results };
            }

            // 在恢复模式下，只有未成功的节点才设置为running状态
            node.properties.runRuntime.variables = getNodeVariables(nodeId);
            console.log(
                `engine.run.variables.before.${nodeId}.${nodeTitle}`,
                JSON.parse(
                    JSON.stringify(node.properties.runRuntime.variables),
                ),
            );
            if (finalOptions.isContinue) {
                if (node.properties.status === "success") {
                    updateRunRuntimeVariables(node);
                    calcNextNode(node);
                    executed.add(nodeId);
                    console.log(
                        `engine.run.variables.after.continue.${nodeId}.${nodeTitle}`,
                        JSON.parse(
                            JSON.stringify(
                                node.properties.runRuntime.variables,
                            ),
                        ),
                    );
                    continue;
                }
                node.properties.status = "running";
                finalOptions.onNodeStatusChange!(data, node.id, "running");
            } else {
                if (node.properties.status === "success") {
                    updateRunRuntimeVariables(node);
                    calcNextNode(node);
                    executed.add(nodeId);
                    continue;
                } else if (node.properties.status === "success_ignore") {
                    calcNextNode(node);
                    executed.add(nodeId);
                    continue;
                } else {
                    node.properties.status = "running";
                    finalOptions.onNodeStatusChange!(data, node.id, "running");
                }
            }

            // 收集inputs
            const runInputs: Record<string, any> = {};
            const incomingEdges = data.edges.filter(
                (edge) => edge.targetNodeId === nodeId,
            );

            // 获取当前节点的inputFields名称集合
            const inputFieldNames = new Set<string>();
            if (node.properties.inputFields) {
                node.properties.inputFields.forEach((field) =>
                    inputFieldNames.add(field.name),
                );
            }

            for (const edge of incomingEdges) {
                if (edge.sourceNodeId && nodeOutputs.has(edge.sourceNodeId)) {
                    const sourceOutputs = nodeOutputs.get(edge.sourceNodeId)!;
                    // 只保留当前节点inputFields中定义的字段
                    for (const fieldName of inputFieldNames) {
                        if (sourceOutputs[fieldName] !== undefined) {
                            runInputs[fieldName] = sourceOutputs[fieldName];
                        }
                    }
                }
            }

            // 处理inputFields
            if (node.properties.inputFields) {
                for (const field of node.properties.inputFields) {
                    let value = field.value;
                    // 解析变量表达式，支持中间变量格式，如：前缀${变量}后缀
                    value = resolveVariables(
                        value as any,
                        node.properties.runRuntime.variables,
                        field.defaultValue as any,
                    );
                    runInputs[field.name] = value;
                }
            }

            node.properties.runInputs = { ...runInputs };
            finalOptions.onNodeDataChange!(data, node.id, {
                runInputs: node.properties.runInputs,
            });

            // 执行节点
            const schedule = scheduleMap.get(node.type);
            if (!schedule) {
                const errorMsg = t("类型 {type} 没有调度器", {
                    type: node.type,
                });
                node.properties.status = "error";
                node.properties.statusMsg = errorMsg;
                finalOptions.onNodeStatusChange!(
                    data,
                    node.id,
                    "error",
                    errorMsg,
                );
                errors.push(
                    t(`节点 {title}: {error}`, {
                        title: node.properties.title,
                        error: errorMsg,
                    }),
                );
                data.status = "error";
                finalOptions.onStatusChange!(data, "error", errorMsg);
                finalOptions.onLog!(
                    data,
                    "error",
                    `节点 ${node.properties.title} 失败: ${errorMsg}`,
                );
                finalOptions.onFinish!(data, false, errors, results);
                return { success: false, errors: [errorMsg], results };
            }

            finalOptions.onLog!(
                data,
                "info",
                `执行节点 ${node.properties.title} (${node.type})`,
            );

            const runController: NodeRunController = {
                updateNodeData: (nodeId, properties, merge) => {
                    const n = data.nodes.find((nd) => nd.id === nodeId);
                    if (n) {
                        if (merge) {
                            for (const key in properties) {
                                properties[key] = {
                                    ...(n.properties[key] || {}),
                                    ...properties[key],
                                };
                            }
                        }
                        Object.assign(n.properties, properties);
                        finalOptions.onNodeDataChange!(
                            data,
                            nodeId,
                            properties,
                        );
                    }
                },
                updateNodeRunData: (nodeId, runData) => {
                    const n = data.nodes.find((nd) => nd.id === nodeId);
                    if (n) {
                        n.properties.runData = {
                            ...(n.properties.runData || {}),
                            ...runData,
                        };
                        finalOptions.onNodeDataChange!(data, nodeId, {
                            runData: n.properties.runData,
                        });
                    }
                },
            };

            const runParam: NodeRunParam = {
                node,
                runInputs,
                runData: node.properties.runData!,
                variables: node.properties.runRuntime.variables,
            };
            console.log(`engine.run.param.${nodeId}.${nodeTitle}`, runParam);

            finalOptions.onNodeStart!(data, nodeId, runParam);

            try {
                // 检查取消状态（在执行前）
                if (signal.aborted) {
                    throw new Error(t("工作流执行已被取消"));
                }

                const result: NodeRunResult = await schedule.run(
                    runController,
                    runParam,
                );

                console.log(`engine.run.result.${nodeId}.${nodeTitle}`, result);

                // 检查取消状态（在执行后）
                if (signal.aborted) {
                    const cancelMsg = t("用户手动取消");
                    node.properties.status = "error";
                    node.properties.statusMsg = cancelMsg;
                    finalOptions.onNodeStatusChange!(
                        data,
                        node.id,
                        "error",
                        cancelMsg,
                    );
                    data.status = "error";
                    finalOptions.onLog!(data, "warn", cancelMsg);
                    finalOptions.onStatusChange!(data, "error", cancelMsg);
                    finalOptions.onFinish!(data, false, [cancelMsg], results);
                    return { success: false, errors: [cancelMsg], results };
                }

                results.set(nodeId, result);
                node.properties.status = result.status;
                node.properties.statusMsg = result.statusMsg;
                node.properties.runOutputs = result.runOutputs;
                node.properties.runData = result.runData;
                finalOptions.onNodeDataChange!(data, node.id, {
                    runOutputs: node.properties.runOutputs,
                    runData: node.properties.runData,
                });

                finalOptions.onLog!(
                    data,
                    result.status === "error" ? "error" : "info",
                    `节点 ${node.properties.title} 完成，状态: ${result.status}`,
                );

                // 如果执行成功但状态消息包含错误信息，则清理状态消息
                if (
                    result.status === "success" &&
                    result.statusMsg &&
                    result.statusMsg.includes("错误")
                ) {
                    node.properties.statusMsg = "";
                    result.statusMsg = "";
                }

                // 处理outputFields
                if (node.properties.outputFields) {
                    for (const field of node.properties.outputFields) {
                        if (result.runOutputs[field.name] !== undefined) {
                            field.value = result.runOutputs[field.name];
                        }
                    }
                }

                nodeOutputs.set(nodeId, result.runOutputs);
                // 更新当前节点的variables快照
                updateRunRuntimeVariables(node);

                console.log(
                    `engine.run.variables.after.${nodeId}.${nodeTitle}`,
                    node.properties.runRuntime.variables,
                );
                // 存储当前节点的variables快照
                finalOptions.onNodeStatusChange!(
                    data,
                    node.id,
                    result.status,
                    result.statusMsg,
                );
                finalOptions.onNodeFinish!(data, nodeId, result);

                // 检查节点执行结果是否为pause，如果是则停止执行
                if (result.status === "pause") {
                    data.status = "pause";
                    finalOptions.onLog!(
                        data,
                        "warn",
                        `节点 ${node.properties.title} 返回暂停，停止执行后续节点`,
                    );
                    finalOptions.onStatusChange!(
                        data,
                        "pause",
                        t(`节点 {title} 暂停执行`, {
                            title: node.properties.title,
                        }),
                    );
                    finalOptions.onFinish!(data, true, errors, results);
                    return { success: true, errors, results };
                }

                // 检查是否需要停止
                if (
                    finalOptions.stopNodeId &&
                    nodeId === finalOptions.stopNodeId
                ) {
                    data.status = "pause";
                    finalOptions.onLog!(
                        data,
                        "warn",
                        `在节点 ${node.properties.title} 停止执行`,
                    );
                    finalOptions.onStatusChange!(
                        data,
                        "pause",
                        `在节点 ${node.properties.title} 停止`,
                    );
                    finalOptions.onFinish!(data, true, errors, results);
                    return { success: true, errors, results };
                }

                // 如果执行成功，根据输出激活下一个节点
                if (result.status === "success") {
                    calcNextNode(node);
                    executed.add(nodeId);
                } else if (result.status === "error") {
                    errors.push(
                        t(`节点 {title}: {error}`, {
                            title: node.properties.title,
                            error: result.statusMsg || "未知错误",
                        }),
                    );
                }
            } catch (error) {
                console.error("Workflow.engine.run.error", error);
                // 检查是否是取消导致的错误
                if (signal.aborted || (error as Error)?.name === "AbortError") {
                    const cancelMsg = "用户手动取消";
                    node.properties.status = "error";
                    node.properties.statusMsg = cancelMsg;
                    finalOptions.onNodeStatusChange!(
                        data,
                        node.id,
                        "error",
                        cancelMsg,
                    );
                    data.status = "error";
                    finalOptions.onLog!(data, "warn", cancelMsg);
                    finalOptions.onStatusChange!(data, "error", cancelMsg);
                    const cancelResult: NodeRunResult = {
                        status: "error",
                        statusMsg: cancelMsg,
                        runOutputs: {},
                    };
                    results.set(nodeId, cancelResult);
                    finalOptions.onNodeFinish!(data, nodeId, cancelResult);
                    finalOptions.onFinish!(data, false, [cancelMsg], results);
                    return { success: false, errors: [cancelMsg], results };
                }

                const errorMsg = t("执行错误: {error}", {
                    error: String(error),
                });
                node.properties.status = "error";
                node.properties.statusMsg = errorMsg;
                finalOptions.onNodeStatusChange!(
                    data,
                    node.id,
                    "error",
                    errorMsg,
                );
                errors.push(
                    t(`节点 {title}: {error}`, {
                        title: node.properties.title,
                        error: errorMsg,
                    }),
                );
                finalOptions.onLog!(
                    data,
                    "error",
                    `节点 ${node.properties.title} 失败: ${errorMsg}`,
                );
                data.status = "error";
                finalOptions.onStatusChange!(data, "error", errorMsg);
                // 创建错误结果并调用onNodeFinish
                const errorResult: NodeRunResult = {
                    status: "error",
                    statusMsg: errorMsg,
                    runOutputs: {},
                };
                results.set(nodeId, errorResult);
                finalOptions.onNodeFinish!(data, nodeId, errorResult);
            }
        }

        // 执行完成
        const hasErrors = errors.length > 0;
        data.status = hasErrors ? "error" : "success";
        finalOptions.onLog!(
            data,
            hasErrors ? "error" : "info",
            `工作流执行完成，状态: ${data.status}`,
        );
        finalOptions.onStatusChange!(
            data,
            data.status,
            hasErrors ? t("执行完成但有错误") : t("执行成功完成"),
        );
        finalOptions.onFinish!(data, !hasErrors, errors, results);

        return { success: !hasErrors, errors, results };
    };

    return {
        cancel: () => controller.abort(),
        result,
    };
}

// 构建图用于拓扑排序
function buildGraph(data: WorkflowData): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    data.nodes.forEach((node) => graph.set(node.id, []));
    data.edges.forEach((edge) => {
        if (edge.sourceNodeId && edge.targetNodeId) {
            graph.get(edge.sourceNodeId)!.push(edge.targetNodeId);
        }
    });
    return graph;
}

// 构建反向图用于查找上游节点
function buildReverseGraph(data: WorkflowData): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    data.nodes.forEach((node) => graph.set(node.id, []));
    data.edges.forEach((edge) => {
        if (edge.sourceNodeId && edge.targetNodeId) {
            graph.get(edge.targetNodeId)!.push(edge.sourceNodeId);
        }
    });
    return graph;
}

function getParentNodes(data: WorkflowData, nodeId: string): string[] {
    return data.edges
        .filter((edge) => edge.targetNodeId === nodeId && edge.sourceNodeId)
        .map((edge) => edge.sourceNodeId!) as string[];
}

// 获取指定节点的上游节点集合（反向可达）
function getUpstreamNodes(
    data: WorkflowData,
    targetNodeId: string,
): Set<string> {
    const upstream = new Set<string>();
    const reverseGraph = buildReverseGraph(data);
    const visited = new Set<string>();
    const queue = [targetNodeId];
    visited.add(targetNodeId);
    upstream.add(targetNodeId);

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        for (const predecessor of reverseGraph.get(nodeId) || []) {
            if (!visited.has(predecessor)) {
                visited.add(predecessor);
                queue.push(predecessor);
                upstream.add(predecessor);
            }
        }
    }
    return upstream;
}

// 检查节点是否可以执行：返回执行状态
function getNodeExecutionStatus(
    data: WorkflowData,
    nodeId: string,
    executed: Set<string>,
): { canExecute: boolean; shouldIgnore: boolean } {
    const incomingEdges = data.edges.filter(
        (edge) => edge.targetNodeId === nodeId,
    );
    if (incomingEdges.length === 0) {
        // 没有上游节点，可以执行（比如Start节点）
        return { canExecute: true, shouldIgnore: false };
    }

    let hasSuccess = false;
    let allIgnore = true;
    let hasIdle = false;
    let hasUnExecuted = false;

    for (const edge of incomingEdges) {
        if (edge.sourceNodeId) {
            if (!hasUnExecuted) {
                hasUnExecuted = !executed.has(edge.sourceNodeId);
            }
            const sourceNode = data.nodes.find(
                (n) => n.id === edge.sourceNodeId,
            );
            if (sourceNode) {
                let status: NodeStatus;
                if (sourceNode.type === "IfElse") {
                    if (
                        sourceNode.properties.runData?.["Next"] ===
                        edge.sourceAnchorId
                    ) {
                        status = "success";
                    } else {
                        status = "success_ignore";
                    }
                } else {
                    status = sourceNode.properties.status;
                }

                if (status === "success") {
                    hasSuccess = true;
                    allIgnore = false;
                } else if (status === "idle") {
                    hasIdle = true;
                } else if (status !== "success_ignore") {
                    allIgnore = false;
                }
            }
        }
    }

    if (!hasUnExecuted && allIgnore) {
        // 所有上游都是 success_ignore，标记为 success_ignore
        return { canExecute: false, shouldIgnore: true };
    } else if (hasSuccess) {
        // 至少有一个 success，可以执行
        return { canExecute: !hasIdle && !hasUnExecuted, shouldIgnore: false };
    } else {
        // 有其他状态但没有 success，不能执行
        return { canExecute: false, shouldIgnore: false };
    }
}

// 检测是否有循环
function hasCycle(graph: Map<string, string[]>): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(nodeId: string): boolean {
        if (recStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recStack.add(nodeId);

        for (const neighbor of graph.get(nodeId) || []) {
            if (dfs(neighbor)) return true;
        }

        recStack.delete(nodeId);
        return false;
    }

    for (const nodeId of graph.keys()) {
        if (dfs(nodeId)) return true;
    }
    return false;
}

//
// // 获取激活的输出handles，根据节点类型和运行输出
// function getActivatedHandles(node: WorkflowNode, runData: Record<string, any>): string[] {
//     if (node.type === 'IfElse') {
//         // console.log('engine.getActivatedHandles.IfElse', {runOutputs});
//         const next = runData['Next'];
//         return next ? [next] : [];
//     } else {
//         return node.properties.outputs?.map(o => o.id) || [];
//     }
// }
