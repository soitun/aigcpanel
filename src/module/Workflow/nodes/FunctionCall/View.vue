<script lang="ts">
import { defineComponent } from "vue";
import InputInlineEditor from "../../../../components/common/InputInlineEditor.vue";
import { NodeMixin } from "../mixin";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import defaultIcon from "~icons/mdi/function-variant";
import { FunctionCallNodes } from "../../../../pages/Workflow/lib";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";

const FC_COLORS = [
    "#3b82f6",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#06b6d4",
    "#84cc16",
    "#e11d48",
    "#a855f7",
];

function getFcColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
    }
    return FC_COLORS[Math.abs(hash) % FC_COLORS.length];
}

export default defineComponent({
    components: {
        NodeViewInputFields,
        NodeViewHeader,
        FieldIcon,
        InputInlineEditor,
    },
    mixins: [NodeMixin],
    mounted() {
        this.init({
            icon: defaultIcon,
        });
    },
    computed: {
        resolvedFcNode() {
            return (
                FunctionCallNodes.find(
                    (fc) => fc.name === this.properties?.functionCallName,
                ) || null
            );
        },
        dynamicComponent() {
            return (this as any).resolvedFcNode?.comp || null;
        },
        resolvedIcon() {
            return (this as any).resolvedFcNode?.icon || defaultIcon;
        },
        resolvedFcColor() {
            const name = this.properties?.functionCallName;
            if (!name) return undefined;
            return getFcColor(name);
        },
    },
});
</script>

<template>
    <div ref="container" class="node-container">
        <NodeViewHeader
            :node="node"
            :properties="properties"
            :icon="resolvedIcon"
            :color="resolvedFcColor"
        />
        <div class="node-content p-2">
            <NodeViewInputFields v-if="properties" :properties="properties" />
            <div
                v-if="dynamicComponent && properties"
                class="border rounded-lg"
            >
                <component
                    :is="dynamicComponent"
                    source="view"
                    :node="node"
                    :properties="properties"
                />
            </div>
        </div>
    </div>
</template>
