<script lang="ts">
import { FunctionCallNodes } from "../../../../pages/Workflow/lib";
import { ConfigMixin } from "../mixin";
import { setNodePropertiesById } from "../../core/global";

export default {
    name: "FunctionCallConfig",
    mixins: [ConfigMixin],
    computed: {
        dynamicComponent() {
            return (
                FunctionCallNodes.find(
                    (fc) => fc.name === this.properties?.functionCallName,
                )?.comp || null
            );
        },
    },
    methods: {
        onChange(props: any) {
            setNodePropertiesById(this.node?.id, props);
        },
    },
};
</script>

<template>
    <div class="space-y-4">
        <div v-if="dynamicComponent && properties">
            <component
                :is="dynamicComponent"
                source="config"
                :node="node"
                :properties="properties"
                @change="onChange"
            />
        </div>
    </div>
</template>
