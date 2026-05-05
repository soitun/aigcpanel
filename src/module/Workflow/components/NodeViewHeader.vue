<script setup lang="ts">
import InputInlineEditor from "../../../components/common/InputInlineEditor.vue";
import NodeMoreAction from "./NodeMoreAction.vue";
import { setNodeTitle } from "../core/global";
import NodeStatus from "./NodeStatus.vue";
import { WorkflowNodeDefs } from "../core/node";
import { computed } from "vue";

const props = defineProps<{
    node: any;
    properties: any;
    icon: any;
    color?: string;
}>();
const onEditTitle = async (newTitle: string): Promise<boolean> => {
    return setNodeTitle(props.node.id, newTitle);
};

const resolvedColor = computed(() => {
    if (props.color) return props.color;
    const def = WorkflowNodeDefs.find((d) => d.type === props.node?.type);
    return def?.color;
});
</script>

<template>
    <div class="node-header">
        <div class="node-icon">
            <component
                :is="typeof icon === 'string' ? 'img' : icon"
                :src="typeof icon === 'string' ? icon : undefined"
                class="w-5 h-5"
                :style="resolvedColor ? { color: resolvedColor } : {}"
            />
        </div>
        <div class="node-title">
            <div class="body">
                {{ properties?.title || "UnknownNode" }}
            </div>
            <div class="edit" v-if="node?.type !== 'Start'">
                <InputInlineEditor
                    :value="properties?.title"
                    :on-change-callback="onEditTitle"
                >
                    <a class="ml-1 text-gray-400" href="javascript:;">
                        <icon-pen />
                    </a>
                </InputInlineEditor>
            </div>
        </div>
        <div class="node-more">
            <NodeMoreAction :node="node" :properties="properties" />
            <NodeStatus :node="node" :properties="properties" />
        </div>
    </div>
</template>
