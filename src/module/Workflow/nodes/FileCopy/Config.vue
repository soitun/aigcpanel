<script setup lang="ts">
import { ref } from "vue";
import ParamView from "./ParamView.vue";
import { NodeProperties } from "../../core/type";
import ConfigDialog from "./ConfigDialog.vue";

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
        <div class="space-y-2 max-h-64 overflow-y-auto">
            <ParamView :properties="properties" />
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
