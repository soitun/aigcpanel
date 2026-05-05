<template>
    <a-button @click="onAddComponent" size="small">
        <template #icon>
            <icon-plus />
        </template>
    </a-button>
    <NodeSelectorDialog ref="nodeSelectorDialog" @select="onSelectComponent" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ObjectUtil } from "../../../lib/util";
import { FunctionCallNodes } from "../../../pages/Workflow/lib";
import { WorkflowNodeDefs } from "../core/node";
import { getEditor, getNodeNewTitle } from "../core/global";
import { NodeField, NodeSelectorItem, WorkflowNode } from "../core/type";
import NodeSelectorDialog from "./NodeSelectorDialog.vue";

const nodeSelectorDialog = ref<{ show: () => void } | null>(null);

const onAddComponent = () => {
    nodeSelectorDialog.value?.show();
};

const onSelectComponent = (component: NodeSelectorItem) => {
    if (getEditor()) {
        const transform = getEditor().getTransform();
        const centerX =
            (window.innerWidth / 2 - transform.TRANSLATE_X) / transform.SCALE_X;
        const centerY =
            (window.innerHeight / 2 - transform.TRANSLATE_Y) /
            transform.SCALE_Y;
        const newNodeIdPart: string[] = [];
        newNodeIdPart.push(component.type);
        if (component.name && component.name !== component.type) {
            newNodeIdPart.push(component.name);
        }
        newNodeIdPart.push(Date.now().toString());
        const newNodeId = newNodeIdPart.join(".");
        let inputFields: NodeField[] = [];
        let outputFields: NodeField[] = [];
        const cloneFields = (fields: NodeField[]) => {
            return ObjectUtil.clone(fields || []).map((f) => {
                let value = f.value || "";
                let defaultValue = f.defaultValue || "";
                if ("" === value) {
                    if (f.type === "files") {
                        value = [];
                    } else if (f.type === "json") {
                        value = {};
                    }
                }
                if ("" === defaultValue) {
                    if (f.type === "files") {
                        defaultValue = [];
                    } else if (f.type === "json") {
                        defaultValue = {};
                    }
                }
                return {
                    defaultValue,
                    placeholder: f.placeholder || "",
                    value,
                    fileExtensions: f.fileExtensions || [],
                    selectOptions: f.selectOptions || [],
                    ...f,
                };
            });
        };
        if (component.type === "FunctionCall") {
            for (const fc of FunctionCallNodes) {
                if (fc.name === component.name) {
                    inputFields = cloneFields(fc.inputFields || []);
                    outputFields = cloneFields(fc.outputFields || []);
                    break;
                }
            }
        } else {
            for (const wn of WorkflowNodeDefs) {
                if (wn.type === component.type) {
                    inputFields = cloneFields(wn.inputFields || []);
                    outputFields = cloneFields(wn.outputFields || []);
                    break;
                }
            }
        }
        const outputs = [{ id: "output_default", type: "any" }];
        if (component.type === "IfElse") {
            outputs.push({ id: "output_else", type: "any" });
        }
        const newNode = {
            id: newNodeId,
            type: component.type,
            x: centerX,
            y: centerY,
            properties: {
                width: 240,
                height: 200,
                title: getNodeNewTitle(component.title),
                inputs: [{ id: "input_default", type: "any" }],
                outputs,
                inputFields,
                outputFields,
                functionCallName: component.name,
                status: "idle",
            },
        } as WorkflowNode;
        getEditor().addNode(newNode);
    }
};
</script>

<script lang="ts">
export default {
    name: "NodeAddAction",
};
</script>
