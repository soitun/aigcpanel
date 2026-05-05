import { t } from "../../../lang";
import DefaultIcon from "~icons/mdi/shape-square-rounded-plus";
import { WorkflowNodeDefs } from "./node";
import { WorkflowNode, WorkflowEdge } from "./type";

export const getNodeStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
        running: t("运行中"),
        success: t("成功"),
        error: t("失败"),
        pause: t("暂停"),
        idle: t("未运行"),
    };
    return statusMap[status] || status;
};

export const getNodeStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
        running: "blue",
        success: "green",
        error: "red",
        pause: "orange",
        idle: "gray",
    };
    return colorMap[status] || "gray";
};

export const getNodeIcon = (nodeType: string) => {
    const wn = WorkflowNodeDefs.find((n) => n.type === nodeType);
    return wn?.icon || DefaultIcon;
};

/**
 * 自动布局：基于拓扑排序，每行最多 maxPerRow 个节点。
 * 修改传入的 nodes 数组中每个节点的 x/y 坐标并返回。
 */
export const autoLayoutWorkflow = (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    options?: {
        colSpacing?: number;
        rowSpacing?: number;
        maxPerRow?: number;
        startX?: number;
        startY?: number;
    },
): WorkflowNode[] => {
    const colSpacing = options?.colSpacing ?? 280;
    const rowSpacing = options?.rowSpacing ?? 240;
    const maxPerRow = options?.maxPerRow ?? 5;
    const startX = options?.startX ?? 100;
    const startY = options?.startY ?? 100;

    // 构建邻接表
    const children: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();
    for (const n of nodes) {
        children.set(n.id, []);
        inDegree.set(n.id, 0);
    }
    for (const e of edges) {
        if (children.has(e.sourceNodeId)) {
            children.get(e.sourceNodeId)!.push(e.targetNodeId);
        }
        if (inDegree.has(e.targetNodeId)) {
            inDegree.set(
                e.targetNodeId,
                (inDegree.get(e.targetNodeId) || 0) + 1,
            );
        }
    }

    // BFS 分层
    const levels: string[][] = [];
    let queue: string[] = [];
    // 优先从 Start 节点开始
    const startNode = nodes.find(
        (n) => n.type === "Start" || inDegree.get(n.id) === 0,
    );
    if (startNode) {
        queue.push(startNode.id);
    } else {
        queue = nodes.map((n) => n.id);
    }
    const visited = new Set<string>();
    for (const id of queue) visited.add(id);

    while (queue.length > 0) {
        levels.push([...queue]);
        const next: string[] = [];
        for (const id of queue) {
            for (const childId of children.get(id) || []) {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    next.push(childId);
                }
            }
        }
        queue = next;
    }
    // 将未访问到的节点追加在最后一行
    for (const n of nodes) {
        if (!visited.has(n.id)) {
            levels.push([n.id]);
        }
    }

    // 按层分配位置，每行最多 maxPerRow 个
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    let currentRow = 0;
    for (const level of levels) {
        // 将本层节点按 maxPerRow 拆分成多行
        for (let i = 0; i < level.length; i += maxPerRow) {
            const rowNodes = level.slice(i, i + maxPerRow);
            for (let col = 0; col < rowNodes.length; col++) {
                const n = nodeById.get(rowNodes[col]);
                if (n) {
                    n.x = startX + col * colSpacing;
                    n.y = startY + currentRow * rowSpacing;
                }
            }
            currentRow++;
        }
    }

    return nodes;
};
