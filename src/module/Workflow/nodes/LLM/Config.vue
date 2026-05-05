<script setup lang="ts">
import { NodeProperties } from "../../core/type";
import ConfigDialog from "./ConfigDialog.vue";
import { ref } from "vue";
import { t } from "../../../../lang";

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
        <div v-if="!props.properties?.data?.info">
            <a-tag class="rounded-lg truncate block" size="small" color="red">
                {{ t("未配置模型") }}
            </a-tag>
        </div>
        <div v-else class="flex items-center gap-1 flex-wrap">
            <a-tag class="rounded-lg truncate block" size="small">
                {{ t("模型") }} :
                {{
                    props.properties?.data?.info?.providerTitle ||
                    t("未知提供商")
                }}
                -
                {{ props.properties?.data?.info?.modelName || t("未知模型") }}
            </a-tag>
            <a-tag class="rounded-lg truncate block" size="small">
                {{ t("格式") }} :
                {{ props.properties?.data?.format || t("未配置") }}
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
