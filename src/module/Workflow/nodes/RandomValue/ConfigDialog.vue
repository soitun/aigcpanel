<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../../../../lang";
import { NodeProperties } from "../../core/type";

const visible = ref(false);

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();

const values = computed({
    get: () => props.properties?.data?.values || [],
    set: (val: string[]) =>
        onUpdate({ data: { ...(props.properties?.data || {}), values: val } }),
});

const onUpdate = (val: any) => {
    emit("update", { ...val });
};

const addItem = () => {
    values.value = [...values.value, ""];
};

const removeItem = (index: number) => {
    values.value = values.value.filter((_, i) => i !== index);
};

const updateItem = (index: number, value: string) => {
    const newValues = [...values.value];
    newValues[index] = value;
    values.value = newValues;
};

defineExpose({
    show: () => {
        visible.value = true;
    },
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        title-align="start"
        :footer="false"
        :title="t('配置随机值')"
        width="600px"
    >
        <div
            class="-mx-4 -my-5 p-4 overflow-y-auto"
            style="height: calc(100vh - 20rem)"
        >
            <div class="space-y-2">
                <div
                    v-for="(item, index) in values"
                    :key="index"
                    class="flex items-center space-x-2"
                >
                    <a-textarea
                        size="small"
                        :model-value="item"
                        @input="(val) => updateItem(index, val)"
                        :auto-size="{ minRows: 1, maxRows: 4 }"
                        :placeholder="t('输入字符串')"
                    />
                    <a-button
                        type="outline"
                        size="small"
                        @click="removeItem(index)"
                        status="danger"
                    >
                        <template #icon>
                            <icon-delete />
                        </template>
                    </a-button>
                </div>
                <div>
                    <a-button size="small" @click="addItem">
                        <template #icon>
                            <icon-plus />
                        </template>
                    </a-button>
                </div>
            </div>
        </div>
    </a-modal>
</template>
