<script setup lang="ts">
import { NodeProperties } from "../../core/type";
import ConfigDialog from "./ConfigDialog.vue";
import { ref } from "vue";

const props = defineProps<{
    node: any;
    properties: NodeProperties;
}>();

const emit = defineEmits<{
    updateProperties: [val: NodeProperties];
}>();

const configDialog = ref<InstanceType<typeof ConfigDialog> | null>(null);
const onUpdate = (p: any) => {
    emit("updateProperties", p);
};
</script>

<template>
    <div class="p-2">
        <div>
            <a-tag class="rounded-lg truncate max-w-full block" size="small">
                MCP Server : {{ props.properties?.data?.serverUrl || "未配置" }}
            </a-tag>
        </div>
        <div class="mt-2">
            <a-tag class="rounded-lg truncate max-w-full block" size="small">
                Tools : {{ props.properties?.data?.selectedTool || "未配置" }}
            </a-tag>
        </div>
        <div class="mt-2">
            <a-button size="small" class="w-full" @click="configDialog?.show()">
                <template #icon>
                    <icon-settings />
                </template>
                {{ $t("配置") }}
            </a-button>
        </div>
    </div>
    <ConfigDialog ref="configDialog" v-bind="props" @update="onUpdate" />
</template>
