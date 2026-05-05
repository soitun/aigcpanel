<script lang="ts">
import { defineComponent } from "vue";
import { t } from "../../../../lang";
import FieldIcon from "../../components/FieldIcon.vue";
import NodeViewHeader from "../../components/NodeViewHeader.vue";
import NodeViewInputFields from "../../components/NodeViewInputFields.vue";
import { NodeMixin } from "../mixin";
import icon from "~icons/mdi/file-multiple";
import ParamView from "./ParamView.vue";

export default defineComponent({
    methods: { t },
    components: { NodeViewInputFields, FieldIcon, NodeViewHeader, ParamView },
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
                :empty-text="t('配置后显示参数')"
            />
            <!--            <ParamView :properties="properties!" />-->
        </div>
    </div>
</template>
