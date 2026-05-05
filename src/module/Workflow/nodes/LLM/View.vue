<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import icon from "~icons/mdi/brain";
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
                <div v-if="!properties?.data?.info">
                    <a-tag
                        class="rounded-lg truncate block"
                        size="small"
                        color="red"
                    >
                        {{ t("未配置模型") }}
                    </a-tag>
                </div>
                <div v-else class="flex items-center gap-1 flex-wrap">
                    <a-tag class="rounded-lg truncate block" size="small">
                        {{ t("模型") }} :
                        {{
                            properties?.data?.info?.providerTitle ||
                            t("未知提供商")
                        }}
                        -
                        {{ properties?.data?.info?.modelName || t("未知模型") }}
                    </a-tag>
                    <a-tag class="rounded-lg truncate block" size="small">
                        {{ t("格式") }} :
                        {{ properties?.data?.format || t("未配置") }}
                    </a-tag>
                </div>
            </div>
        </div>
    </div>
</template>
