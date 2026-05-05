<script lang="ts">
import { defineComponent } from "vue";
import { NodeMixin } from "../mixin";
import icon from "~icons/mdi/play-circle-outline";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import FieldIcon from "../../components/FieldIcon.vue";
import { t } from "../../../../lang";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";

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
                :properties="properties!"
                :empty-text="t('点击设置启动参数')"
            />
        </div>
    </div>
</template>
