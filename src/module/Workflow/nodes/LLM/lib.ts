import { computed, toRaw } from "vue";
import { NodeProperties } from "../../core/type";

export type LLMNodeProps = {
    source: "config" | "view";
    properties: NodeProperties;
    node: any;
};

export type LLMNodeEmits = {
    change: (properties: any) => void;
};

export const useLLMNode = (
    props: LLMNodeProps,
    emit: (event: keyof LLMNodeEmits, ...args: any[]) => void,
) => {
    const nodeData = computed(() => props.properties.data || {});
    const nodeRunData = computed(() => props.properties.runData || {});
    const nodeUpdateData = (newData: any) => {
        emit("change", {
            data: toRaw({
                ...nodeData.value,
                ...newData,
            }),
        });
    };
    return {
        nodeData,
        nodeRunData,
        nodeUpdateData,
    };
};
