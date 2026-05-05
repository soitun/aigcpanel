<script setup lang="ts">
import { ref, watch } from "vue";
import { t } from "../../../../lang";
import { NodeProperties } from "../../core/type";
import { ModelItem, useModelStore } from "../../../Model/store/model";
import ModelSelector from "../../../Model/ModelSelector.vue";

const visible = ref(false);
const modelSelector = ref<InstanceType<typeof ModelSelector> | null>(null);

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();
const formData = ref({
    model: "",
    format: "text",
    info: {
        providerLogo: "",
        providerTitle: "",
        modelName: "",
    },
});
const modelStore = useModelStore();
const models = ref<ModelItem[]>([]);

watch(
    () => formData.value.model,
    (val) => {
        formData.value.info = modelSelector.value?.getInfo() || {
            providerLogo: "",
            providerTitle: "",
            modelName: "",
        };
    },
    {
        flush: "post",
    },
);

watch(
    () => formData.value,
    (val) => {
        emit("update", {
            data: {
                model: formData.value.model,
                format: formData.value.format,
                info: formData.value.info,
            },
        });
    },
    {
        deep: true,
        flush: "post",
    },
);

defineExpose({
    show: async () => {
        models.value = await modelStore.enabledModels();
        formData.value.model = props.properties?.data?.model || "";
        formData.value.format = props.properties?.data?.format || "text";
        visible.value = true;
    },
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        title="配置"
        width="600px"
        :footer="false"
    >
        <div class="">
            <a-form :model="{}" layout="vertical">
                <a-form-item :label="t('模型')">
                    <ModelSelector
                        ref="modelSelector"
                        v-model="formData.model"
                        class="w-full"
                    />
                </a-form-item>
                <a-form-item :label="t('格式')">
                    <a-select v-model="formData.format" class="w-full">
                        <a-option value="text">文本 (text)</a-option>
                        <a-option value="json">JSON (json)</a-option>
                    </a-select>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>
