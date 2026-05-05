<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import icon from "~icons/mdi/regex";
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
                <div v-if="!properties?.data?.regex">
                    <a-empty description="没有配置正则" />
                </div>
                <div v-else>
                    <a-tag class="block rounded-lg truncate">
                        {{ properties.data.regex }}
                    </a-tag>
                </div>
            </div>
        </div>
    </div>
</template>
