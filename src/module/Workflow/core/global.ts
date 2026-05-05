import LogicFlow from "@logicflow/core";
import { t } from "../../../lang";
import { Dialog } from "../../../lib/dialog";
import { NodeProperties } from "./type";

const _editors = new Map<string, LogicFlow>();
let _activeEditorName = "main";

export const getEditor: (name?: string) => LogicFlow = (name?: string) => {
    return _editors.get(name ?? _activeEditorName) as any;
};
export const setEditor = (
    nameOrEditor: string | LogicFlow | null,
    editorInstance?: LogicFlow | null,
) => {
    if (typeof nameOrEditor === "string") {
        if (editorInstance) {
            _editors.set(nameOrEditor, editorInstance);
            _activeEditorName = nameOrEditor;
        } else {
            _editors.delete(nameOrEditor);
            if (_activeEditorName === nameOrEditor) {
                _activeEditorName = "main";
            }
        }
    } else {
        if (nameOrEditor) {
            _editors.set("main", nameOrEditor as LogicFlow);
        } else {
            _editors.delete("main");
        }
        _activeEditorName = "main";
    }
};
export const setActiveEditor = (name: string) => {
    _activeEditorName = name;
};

export const getGraphModel = () => {
    if (!getEditor()) return null as any;
    return getEditor().graphModel;
};

export const setNodePropertiesById = (
    nodeId: string,
    properties: Partial<NodeProperties>,
) => {
    const node = getEditor().getNodeModelById(nodeId);
    if (node) {
        const value = {
            ...node.getProperties(),
            ...properties,
        };
        node.setProperties(value);
    }
};

export const setNodeHeightById = (nodeId: string, height: number) => {
    if (!getEditor()) return;
    const node = getEditor().getNodeModelById(nodeId);
    if (node) {
        setNodePropertiesById(nodeId, {
            height,
        });
        getGraphModel().edges.forEach((edge) => {
            if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
                if ((edge as any).updatePathByAnchor) {
                    (edge as any).updatePathByAnchor();
                } else {
                    (edge as any).initPoints();
                }
            }
        });
    }
};

export const getNodePropertiesById = (
    nodeId: string,
): NodeProperties | null => {
    const node = getEditor().getNodeModelById(nodeId);
    if (node) {
        return node.getProperties() as NodeProperties;
    }
    return null;
};

export const getNodeNewTitle = (title: string): string => {
    const nodesMap = {};
    getGraphModel().nodes.forEach((node) => {
        const nodeTitle = node.getProperties().title;
        if (nodeTitle) {
            nodesMap[nodeTitle] = node.id;
        }
    });
    if (!nodesMap[title]) {
        return title;
    }
    let index = 1;
    let newTitle = `${title}(${index})`;
    while (nodesMap[newTitle]) {
        index++;
        newTitle = `${title}(${index})`;
    }
    return newTitle;
};

export const idNodeTitleValid = (nodeId: string, title: string): boolean => {
    const nodesMap = {};
    getGraphModel().nodes.forEach((node) => {
        const nodeTitle = node.getProperties().title;
        if (nodeTitle) {
            nodesMap[nodeTitle] = node.id;
        }
    });
    if (!nodesMap[title]) {
        return true;
    }
    if (nodesMap[title] === nodeId) {
        return true;
    }
    return false;
};

const replaceVariableInValue = (
    value: any,
    oldTitle: string,
    newTitle: string,
): any => {
    if (typeof value === "string") {
        return value.replace(
            new RegExp(`\\$\\{${oldTitle}\\.`, "g"),
            `\${${newTitle}.`,
        );
    } else if (Array.isArray(value)) {
        return value.map((item) =>
            replaceVariableInValue(item, oldTitle, newTitle),
        );
    } else if (typeof value === "object" && value !== null) {
        const newObj = {};
        for (const key in value) {
            newObj[key] = replaceVariableInValue(
                value[key],
                oldTitle,
                newTitle,
            );
        }
        return newObj;
    } else {
        return value;
    }
};

export const setNodeTitle = (nodeId: string, title: string) => {
    const node = getEditor().getNodeModelById(nodeId);
    if (!node) {
        Dialog.tipError(t("节点不存在"));
        return false;
    }
    const oldTitle = node.getProperties().title;
    if (oldTitle === title) {
        return true;
    }
    if (!idNodeTitleValid(nodeId, title)) {
        Dialog.tipError(t("节点名称不能重复"));
        return false;
    }
    setNodePropertiesById(nodeId, { title });
    // 更新所有节点中inputFields的value，替换变量引用
    getGraphModel().nodes.forEach((n) => {
        const props = n.getProperties() as NodeProperties;
        if (props.inputFields) {
            const updatedFields = props.inputFields.map((field) => {
                return {
                    ...field,
                    value: replaceVariableInValue(field.value, oldTitle, title),
                };
            });
            if (
                JSON.stringify(updatedFields) !==
                JSON.stringify(props.inputFields)
            ) {
                console.log("updatedFields", {
                    node: props.title,
                    oldTitle,
                    title,
                    updatedFields,
                });
                setNodePropertiesById(n.id, { inputFields: updatedFields });
            }
        }
    });
    return true;
};

export const getGraphData = (): any => {
    return getEditor().getGraphData();
};

export const getFollowNodes = (nodeId: string): string[] => {
    const edges = getGraphModel().edges;
    const followNodes: string[] = [];
    const traverse = (id: string) => {
        edges.forEach((edge) => {
            if (edge.sourceNodeId === id) {
                if (!followNodes.includes(edge.targetNodeId)) {
                    followNodes.push(edge.targetNodeId);
                    traverse(edge.targetNodeId);
                }
            }
        });
    };
    traverse(nodeId);
    return followNodes;
};

export const clearNodeRunDataById = (
    nodeId: string,
    option?: {
        clearRunData: boolean;
    },
) => {
    option = Object.assign(
        {
            clearRunData: false,
        },
        option,
    );
    const followNodeIds = getFollowNodes(nodeId);
    for (const id of [nodeId, ...followNodeIds]) {
        const update: Partial<NodeProperties> = {
            status: "idle",
            statusMsg: "",
            runInputs: {},
            runOutputs: {},
        };
        if (option.clearRunData) {
            update["runData"] = {};
        }
        setNodePropertiesById(id, update);
    }
};
