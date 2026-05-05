<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import { NodeMixin } from "../mixin";
import icon from "~icons/mdi/source-branch";

export default defineComponent({
    methods: { t },
    components: { NodeViewInputFields, FieldIcon, NodeViewHeader },
    mixins: [NodeMixin],
    mounted() {
        this.init({
            icon,
        });
    },
    computed: {
        operatorLabel() {
            const operator = this.properties?.data?.operator;
            const operators = [
                { label: "等于", value: "==" },
                { label: "不等于", value: "!=" },
                { label: "大于", value: ">" },
                { label: "小于", value: "<" },
                { label: "大于等于", value: ">=" },
                { label: "小于等于", value: "<=" },
                { label: "包含", value: "contains" },
                { label: "不包含", value: "not_contains" },
                { label: "开头", value: "starts_with" },
                { label: "结尾", value: "ends_with" },
            ];
            const op = operators.find((o) => o.value === operator);
            return op ? op.label : operator || "==";
        },
    },
});
</script>

<template>
    <div ref="container" class="node-container">
        <NodeViewHeader :node="node" :properties="properties" :icon="icon" />
        <div class="node-content p-2">
            <div v-if="properties?.data?.type === 'simple'">
                <div class="flex gap-1 text-sm font-mono">
                    <a-tag class="rounded-lg">
                        {{ properties?.data?.value1 || $t("未设置") }}
                    </a-tag>
                    <a-tag class="rounded-lg">
                        {{ operatorLabel }}
                    </a-tag>
                    <a-tag class="rounded-lg">
                        {{ properties?.data?.value2 || $t("未设置") }}
                    </a-tag>
                </div>
            </div>
            <div v-else-if="properties?.data?.type === 'code'">
                <div class="text-sm">
                    <pre
                        class="bg-gray-100 p-2 rounded text-xs overflow-auto"
                        >{{ properties?.data?.code || $t("未设置代码") }}</pre
                    >
                </div>
            </div>
            <div v-else>
                <div class="text-sm text-gray-500">{{ $t("无配置") }}</div>
            </div>
        </div>
    </div>
</template>
