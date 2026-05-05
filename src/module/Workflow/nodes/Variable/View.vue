<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import { NodeMixin } from "../mixin";
import icon from "~icons/mdi/variable";

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
                <div
                    v-if="
                        !properties?.data?.variables ||
                        properties.data.variables.length === 0
                    "
                >
                    <a-tag class="block rounded-lg truncate">
                        {{ t("没有配置变量") }}
                    </a-tag>
                </div>
                <div v-else>
                    <a-tag
                        v-for="(variable, index) in properties.data.variables"
                        :key="index"
                        class="block rounded-lg truncate mb-1"
                    >
                        {{ variable.name }} = {{ variable.value }}
                    </a-tag>
                </div>
            </div>
        </div>
    </div>
</template>
