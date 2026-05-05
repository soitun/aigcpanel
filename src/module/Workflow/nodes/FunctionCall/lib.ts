import { NodeProperties } from "../../core/type";
import { computed, toRaw } from "vue";

export type FunctionCallNodeProps = {
    // config : the configuration in the sidebar
    // view : the configuration in the node view
    source: "config" | "view";
    properties: NodeProperties;
    node: any;
};

export type FunctionCallNodeEmits = {
    change: (properties: any) => void;
};

export const useFunctionCallNode = (
    props: FunctionCallNodeProps,
    emit: (event: keyof FunctionCallNodeEmits, ...args: any[]) => void,
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
