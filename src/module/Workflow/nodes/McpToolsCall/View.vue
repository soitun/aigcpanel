<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import icon from "~icons/mdi/tools";
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
            <NodeViewInputFields
                v-if="properties"
                :properties="properties"
                :empty-text="t('配置MCP服务器后显示参数')"
            />
            <div class="m5-2">
                <div>
                    <div
                        class="whitespace-break-spaces p-1 text-xs bg-gray-100 rounded-lg"
                    >
                        {{ properties?.data?.serverUrl || "未配置 MCP Server" }}
                    </div>
                </div>
                <div class="mt-1">
                    <div
                        class="whitespace-break-spaces p-1 text-xs bg-gray-100 rounded-lg"
                    >
                        {{ properties?.data?.selectedTool || "未配置 Tools" }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
