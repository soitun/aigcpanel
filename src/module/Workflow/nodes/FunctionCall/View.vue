<script lang="ts">
import { defineComponent } from "vue";
import InputInlineEditor from "../../../../components/common/InputInlineEditor.vue";
import { NodeMixin } from "../mixin";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import icon from "~icons/mdi/function-variant";
import { FunctionCallNodes } from "../../../../pages/Workflow/lib";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";

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
            icon,
        });
    },
    computed: {
        dynamicComponent() {
            return (
                FunctionCallNodes.find(
                    (fc) => fc.name === this.properties?.functionCallName,
                )?.comp || null
            );
        },
    },
});
</script>

<template>
    <div ref="container" class="node-container">
        <NodeViewHeader :node="node" :properties="properties" :icon="icon" />
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
