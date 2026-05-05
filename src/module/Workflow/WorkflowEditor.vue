<template>
    <div class="pb-workflow-editor h-full flex flex-col">
        <div class="flex-1 flex relative">
            <div ref="container" class="flex-1 bg-gray-50 h-full"></div>
            <FloatingToolbar
                v-if="lf"
                :zoom-level="zoomLevel"
                @zoom-in="doZoomIn"
                @zoom-out="doZoomOut"
                @reset-zoom="doResetZoom"
                @fit-view="doFitView"
            />
            <NodeConfigPanel
                v-if="lf"
                :selected-node="selectedNode"
                @close="onNodeConfigClose"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import LogicFlow from "@logicflow/core";
import "@logicflow/core/es/index.css";
import { onBeforeUnmount, onMounted, onUnmounted, ref } from "vue";
import { t } from "../../lang";
import { Dialog } from "../../lib/dialog";
import FloatingToolbar from "./components/FloatingToolbar.vue";
import NodeConfigPanel from "./components/NodeConfigPanel.vue";
import { init } from "./core/base";
import { clearNodeRunDataById, getEditor, setEditor } from "./core/global";
import { NodeProperties, WorkflowData } from "./core/type";
import { autoLayoutWorkflow } from "./core/util";
import { WorkflowDemoInit } from "./demo/init";
import "./style.less";

const emit = defineEmits<{
    change: [];
    runToNode: [nodeId: string];
}>();

const container = ref<HTMLElement | null>(null);
const lf = ref();
const zoomLevel = ref(1);
const selectedNode = ref<any>(null);
const editorData = ref<WorkflowData | null>(null);

const doZoomIn = () => {
    if (getEditor()) {
        getEditor().zoom(true);
        updateZoomLevel();
    }
};

const doZoomOut = () => {
    if (getEditor()) {
        getEditor().zoom(false);
        updateZoomLevel();
    }
};

const doFitView = () => {
    if (getEditor()) {
        getEditor().fitView();
        updateZoomLevel();
    }
};

const doResetZoom = () => {
    if (getEditor()) {
        getEditor().resetZoom();
        updateZoomLevel();
    }
};

const onNodeConfigClose = () => {
    selectedNode.value = null;
    if (getEditor()) {
        getEditor().clearSelectElements();
    }
    emit("change");
};

const updateZoomLevel = () => {
    if (getEditor()) {
        zoomLevel.value = getEditor().getTransform().SCALE_X;
    }
};

const setNodeProperties = (
    nodeId: string,
    properties: Partial<NodeProperties>,
) => {
    if (getEditor()) {
        const nodeModel = getEditor().getNodeModelById(nodeId);
        if (nodeModel) {
            for (const key in properties) {
                nodeModel.setProperty(key, properties[key]);
            }
            emit("change");
        }
    }
};

const getNodeStatusCount = async (): Promise<{
    idle: number;
    running: number;
    pause: number;
    success: number;
    error: number;
    total: number;
}> => {
    const data = getData();
    const result = {
        idle: 0,
        running: 0,
        pause: 0,
        success: 0,
        error: 0,
        total: 0,
    };
    if (data) {
        for (const node of data.nodes) {
            const status = node.properties.status || "idle";
            if (status in result) {
                (result as any)[status]++;
            }
            result.total++;
        }
    }
    return result;
};

const render = (data: WorkflowData) => {
    data = JSON.parse(JSON.stringify(data));
    // 检测是否需要自动布局：所有非 Start 节点都在 (0,0)
    const nonStartNodes = data.nodes.filter(
        (n) => n.type !== "Start" || (n.x === 0 && n.y === 0),
    );
    const needsLayout =
        nonStartNodes.length > 0 &&
        nonStartNodes.every((n) => n.x === 0 && n.y === 0);
    if (needsLayout) {
        autoLayoutWorkflow(data.nodes, data.edges);
    }
    // fix x and y
    data.nodes.forEach((node) => {
        node.x = node.x + node.properties.width / 2 || 0;
        node.y = node.y + node.properties.height / 2 || 0;
    });
    // console.log('WorkflowEditor.render', data);
    getEditor()?.render({});
    getEditor()?.render(data as any);
};

const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Backspace") {
        //TODO
        // @ts-ignore
        // const selectedElements = getEditor().getSelectElements();
        // if (selectedElements.edges && selectedElements.edges.length === 1) {
        //     // bugfix 选中元素时，第一次按下删除键时，LogicFlow不会触发keyup事件，需要手动触发一次
        //     getEditor().keyboard.mousetrap.trigger(['backspace'], 'keyup');
        // }
    }
};

const editorInit = async () => {
    window.addEventListener("keyup", onKeyUp);
};

const editorDestroy = async () => {
    window.removeEventListener("keyup", onKeyUp);
};

onMounted(() => {
    const graph = new LogicFlow({
        container: container.value as any,
        textEdit: false,
        adjustEdge: true,
        adjustEdgeStartAndEnd: true,
        hoverOutline: false,
        background: {
            backgroundColor: "#f5f6f7",
        },
        grid: {
            size: 10,
            type: "dot",
            config: {
                color: "#DEE0E3",
                thickness: 1,
            },
        },
        keyboard: {
            enabled: true,
            shortcuts: [
                {
                    keys: ["backspace"],
                    action: "keyup",
                    callback: (e: KeyboardEvent) => {
                        const selectedElements =
                            getEditor().getSelectElements();
                        if (selectedElements) {
                            for (const n of selectedElements.nodes) {
                                if (n.type === "Start") {
                                    Dialog.tipError(t("开始节点不能删除"));
                                    return;
                                }
                            }
                            selectedElements.nodes.forEach((node) => {
                                if (
                                    selectedNode.value &&
                                    selectedNode.value.id === node.id
                                ) {
                                    selectedNode.value = null;
                                }
                                getEditor().deleteNode(node.id);
                            });
                            selectedElements.edges.forEach((edge) => {
                                getEditor().deleteEdge(edge.id);
                            });
                        }
                        emit("change");
                    },
                },
            ],
        },
        isSilentMode: false,
    });
    lf.value = graph;
    setEditor(graph);
    init(getEditor());
    getEditor().on("workflow:runToNode", (nodeId: string) => {
        emit("runToNode", nodeId);
    });
    getEditor().on("node:click", ({ data }) => {
        selectedNode.value = data;
        emit("change");
    });
    getEditor().on("blank:click", () => {
        selectedNode.value = null;
        emit("change");
    });
    getEditor().on("node:mouseenter", ({ data }) => {
        const nodeModel = getEditor().getNodeModelById(data.id);
        if (nodeModel) {
            nodeModel.isShowAnchor = true;
        }
    });
    getEditor().on("node:mouseleave", ({ data }) => {
        const nodeModel = getEditor().getNodeModelById(data.id);
        if (nodeModel) {
            nodeModel.isShowAnchor = true;
        }
    });
    getEditor().on("node:focus", ({ data }) => {
        lf.value.container.focus();
    });
    getEditor().on("edge:focus", ({ data }) => {
        lf.value.container.focus();
    });
    getEditor().on("node:dragend", () => {
        emit("change");
    });
    getEditor().on("edge:add", ({ data }) => {
        const { sourceAnchorId, targetAnchorId, id } = data;
        if (!sourceAnchorId || !targetAnchorId) return;
        const isSourceInput = sourceAnchorId.includes("input_");
        const isTargetInput = targetAnchorId.includes("input_");
        if (
            (isSourceInput && isTargetInput) ||
            (!isSourceInput && !isTargetInput)
        ) {
            Dialog.tipError(t("不能连接相同类型的锚点"));
            getEditor().deleteEdge(id);
        } else {
            emit("change");
        }
    });
    getEditor().on("edge:delete", () => {
        emit("change");
    });
    getEditor().on("node:add", () => {
        emit("change");
    });
    getEditor().on("blank:dragend", () => {
        emit("change");
    });
    render(WorkflowDemoInit);
    editorInit().then();
});

onBeforeUnmount(() => {
    editorDestroy().then();
    getEditor()?.destroy();
});

onUnmounted(() => {
    setEditor(null);
});

const isReady = () => {
    return !!getEditor();
};

const getData = (): WorkflowData | null => {
    const rawData = getEditor()?.getGraphData() as any;
    if (!rawData) return null;
    const data: WorkflowData = {
        status: editorData.value?.status || "idle",
        nodes: rawData.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            x: node.x - node.properties.width / 2 || 0,
            y: node.y - node.properties.height / 2 || 0,
            properties: {
                width: node.properties?.width,
                height: node.properties?.height,
                title: node.properties?.title,
                icon: node.properties?.icon,
                inputs: node.properties?.inputs,
                outputs: node.properties?.outputs,
                runData: node.properties?.runData,
                inputFields: node.properties?.inputFields,
                outputFields: node.properties?.outputFields,
                status: node.properties?.status,
                statusMsg: node.properties?.statusMsg,
                runInputs: node.properties?.runInputs,
                runOutputs: node.properties?.runOutputs,
                data: node.properties?.data,
                functionCallName: node.properties?.functionCallName,
            },
        })),
        edges: rawData.edges.map((edge: any) => ({
            id: edge.id,
            type: edge.type,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            sourceAnchorId: edge.sourceAnchorId,
            targetAnchorId: edge.targetAnchorId,
        })),
        viewPositionX: 0,
        viewPositionY: 0,
        viewScale: 1,
    };
    // 获取当前视图信息
    if (getEditor()) {
        const transform = getEditor().getTransform();
        data.viewPositionX = transform.TRANSLATE_X;
        data.viewPositionY = transform.TRANSLATE_Y;
        data.viewScale = transform.SCALE_X;
    }
    return data;
};

let setDataTimer: any = null;
const setData = (data: WorkflowData | null) => {
    if (setDataTimer) {
        clearTimeout(setDataTimer);
    }
    if (!isReady()) {
        setDataTimer = setTimeout(() => {
            setData(data);
        }, 10);
        return;
    }
    // console.log('WorkflowEditor.setData', data)
    editorData.value = data;
    if (data) {
        render(data);
        // 恢复视图位置和缩放
        if (
            data.viewPositionX !== undefined &&
            data.viewPositionY !== undefined &&
            data.viewScale !== undefined
        ) {
            getEditor().translate(data.viewPositionX, data.viewPositionY);
            getEditor().zoom(data.viewScale);
            updateZoomLevel();
        }
    } else {
        render(WorkflowDemoInit);
    }
    emit("change");
};

const clearRunData = () => {
    clearNodeRunDataById("start", {
        clearRunData: true,
    });
    emit("change");
};

defineExpose({
    isReady,
    getData,
    setData,
    setNodeProperties,
    getNodeStatusCount,
    clearRunData,
});
</script>
