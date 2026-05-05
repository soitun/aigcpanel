<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import icon from "~icons/mdi/dice-multiple";
import { NodeMixin } from "../mixin";

export default defineComponent({
    methods: { t },
    components: { NodeViewInputFields, FieldIcon, NodeViewHeader },
    mixins: [NodeMixin],
    mounted() {
        this.init({
            icon,
        });
    },
});
</script>

<template>
    <div ref="container" class="node-container">
        <NodeViewHeader :node="node" :properties="properties" :icon="icon" />
        <div class="node-content p-2">
            <div class="space-y-2 max-h-64 overflow-y-auto">
                <div v-if="!(properties?.data?.values || []).length">
                    <a-empty description="没有配置" />
                </div>
                <div v-for="v in properties?.data?.values || []">
                    <a-tag class="block rounded-lg truncate">
                        {{ v }}
                    </a-tag>
                </div>
            </div>
        </div>
    </div>
</template>
