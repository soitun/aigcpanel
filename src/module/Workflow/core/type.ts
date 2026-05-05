import { DefineComponent } from "vue";
import { WorkflowNodeDefs } from "./node";

export interface NodeAnchor {
    id: string;
    type: string;
}

export type NodeType =
    | "Start"
    | "FunctionCall"
    | (typeof WorkflowNodeDefs)[number]["type"];

export type NodeFieldType =
    | "text"
    | "textarea"
    | "file"
    | "files"
    | "select"
    | "json";

export interface NodeField {
    type: NodeFieldType;
    name: string;
    defaultValue?: string | string[] | object;
    placeholder?: string;
    value?: string | string[] | object;
    // text
    // ...
    // file example: ["mp3","wav"]
    fileExtensions?: string[];
    // select example: ["option1","option2"]
    selectOptions?: string[];
}

export type NodeStatus =
    | "idle"
    | "running"
    | "pause"
    | "success"
    | "error"
    | "success_ignore";

export type WorkflowStatus = "idle" | "running" | "pause" | "success" | "error";

export interface NodeProperties {
    width: number;
    height: number;
    title: string;
    icon: any;
    status: NodeStatus;
    statusMsg?: string;
    inputs?: NodeAnchor[];
    outputs?: NodeAnchor[];
    inputFields?: NodeField[];
    outputFields?: NodeField[];
    runInputs?: Record<string, any>;
    runOutputs?: Record<string, any>;
    runData?: Record<string, any>;
    runRuntime?: {
        variables: Record<string, any>;
    };
    // custom data
    data?: {
        [key: string]: any;
    };
    // functionCall
    functionCallName?: string;
}

export interface WorkflowNode {
    id: string;
    type: string;
    x: number;
    y: number;
    properties: NodeProperties;
}

export interface WorkflowEdge {
    id: string;
    type: string;
    sourceNodeId?: string;
    targetNodeId?: string;
    sourceAnchorId?: string;
    targetAnchorId?: string;
}

export interface WorkflowData {
    status: WorkflowStatus;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    viewPositionX: number;
    viewPositionY: number;
    viewScale: number;
}

export interface NodeSelectorItem {
    type: NodeType;
    name: string;
    title: string;
    icon: any;
    color?: string;
    description: string;
    category: "basic" | "functionCall";
}

export interface NodeFunctionCall {
    name: string;
    title: string;
    icon: any;
    description: string;
    inputFields: NodeField[];
    outputFields: NodeField[];
    comp: DefineComponent<{
        source: "config" | "view";
        node: any;
        properties: NodeProperties;
    }>;

    run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult>;

    check(node: WorkflowNode): Promise<undefined>;
}

export interface NodeRunParam {
    node: WorkflowNode;
    variables: Record<string, any>; // 这个是当前节点执行的时候所有可见的变量（包括上游所有节点的变量汇总）
    runInputs: Record<string, any>;
    runData: Record<string, any>;
}

export interface NodeRunController {
    updateNodeData(
        nodeId: string,
        properties: Partial<{
            runInputs: NodeProperties["runInputs"];
            runOutputs: NodeProperties["runOutputs"];
            runData: NodeProperties["runData"];
            data: NodeProperties["data"];
        }>,
        merge: boolean,
    ): void;

    updateNodeRunData(nodeId: string, runData: NodeProperties["runData"]): void;
}

export type NodeRunResultStatus =
    | "success"
    | "pause"
    | "error"
    | "success_ignore";

export interface NodeRunResult {
    status: NodeRunResultStatus;
    statusMsg: string;
    runOutputs: Record<string, any>;
    runData?: Record<string, any>;
    pauseByType?: "" | "task";
    pauseById?: string;
}

export interface WorkflowSchedule {
    run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult>;

    check(node: WorkflowNode): Promise<undefined>;
}

export interface WorkflowNodeDef {
    type: string;
    title: string;
    icon: any;
    color?: string;
    description: string;
    component?: any;
    configComponent?: any;
    inputFields: NodeField[];
    outputFields: NodeField[];
}
