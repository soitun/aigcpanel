<script setup lang="ts">
import { t } from "../../../lang";
import { Dialog } from "../../../lib/dialog";
import { clearNodeRunDataById, getEditor, getGraphModel } from "../core/global";
import { NodeProperties } from "../core/type";

const props = defineProps<{
    node: any;
    properties?: NodeProperties;
}>();
const doDelete = () => {
    if (props.node.type === "Start") {
        Dialog.tipError(t("开始节点不能删除"));
        return;
    }
    getGraphModel().deleteNode(props.node.id);
};
const doClearNodeData = (clearRunData: boolean) => {
    clearNodeRunDataById(props.node.id, {
        clearRunData,
    });
};
const doRunToNode = () => {
    getEditor().emit("workflow:runToNode", props.node.id);
};
</script>

<template>
    <a-dropdown @click.stop class="pb-workflow-node-more-action">
        <a-tooltip :content="t('更多操作')" placement="top">
            <icon-more class="cursor-pointer" />
        </a-tooltip>
        <template #content>
            <a-doption @click="doRunToNode">
                {{ t("运行到此处") }}
            </a-doption>
            <a-doption @click="doClearNodeData(false)">
                {{ t("清除输入输出") }}
            </a-doption>
            <a-doption @click="doClearNodeData(true)">
                {{ t("清除所有运行数据") }}
            </a-doption>
            <a-doption
                v-if="props.node.type !== 'Start'"
                @click="doDelete"
                class="text-red-500"
            >
                {{ t("删除") }}
            </a-doption>
        </template>
    </a-dropdown>
</template>
