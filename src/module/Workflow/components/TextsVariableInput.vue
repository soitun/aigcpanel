<script setup lang="ts">
import { ref, watch } from "vue";
import { StringUtil } from "../../../lib/util";
import TextVariableInput from "./TextVariableInput.vue";

const props = defineProps<{
    modelValue?: string[];
    placeholder?: string;
    nodeId?: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string[]];
    change: [value: string[]];
}>();

interface Item {
    id: string;
    value: string;
}

const items = ref<Item[]>([]);

// 同步modelValue到items
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            items.value = newVal.map((value) => ({
                id: StringUtil.uuid(),
                value,
            }));
        } else {
            items.value = [];
        }
    },
    { immediate: true },
);

// 同步items到modelValue
const updateModelValue = () => {
    const values = items.value.map((item) => item.value);
    emit("update:modelValue", values);
    emit("change", values);
};

// 添加条目
const doAdd = () => {
    items.value.push({ id: StringUtil.uuid(), value: "" });
    updateModelValue();
};

// 删除条目
const doDelete = (id: string) => {
    const index = items.value.findIndex((item) => item.id === id);
    if (index > -1) {
        items.value.splice(index, 1);
        updateModelValue();
    }
};

// 更新条目
const onItemChange = (id: string, value: string) => {
    const item = items.value.find((item) => item.id === id);
    if (item) {
        item.value = value;
        updateModelValue();
    }
};

// 上移
const doMoveUp = (id: string) => {
    const index = items.value.findIndex((item) => item.id === id);
    if (index > 0) {
        [items.value[index - 1], items.value[index]] = [
            items.value[index],
            items.value[index - 1],
        ];
        updateModelValue();
    }
};

// 下移
const doMoveDown = (id: string) => {
    const index = items.value.findIndex((item) => item.id === id);
    if (index < items.value.length - 1) {
        [items.value[index], items.value[index + 1]] = [
            items.value[index + 1],
            items.value[index],
        ];
        updateModelValue();
    }
};
</script>

<template>
    <div class="texts-variable-input">
        <div
            v-for="(item, index) in items"
            :key="item.id"
            class="flex items-center space-x-2 mb-2"
        >
            <div class="flex-1">
                <TextVariableInput
                    :model-value="item.value"
                    :placeholder="placeholder"
                    :node-id="nodeId"
                    @change="(value) => onItemChange(item.id, value)"
                />
            </div>
            <div class="flex space-x-1">
                <a-button
                    size="small"
                    :disabled="index === 0"
                    @click="doMoveUp(item.id)"
                >
                    <template #icon>
                        <icon-arrow-up />
                    </template>
                </a-button>
                <a-button
                    size="small"
                    :disabled="index === items.length - 1"
                    @click="doMoveDown(item.id)"
                >
                    <template #icon>
                        <icon-arrow-down />
                    </template>
                </a-button>
                <a-button
                    size="small"
                    type="outline"
                    status="danger"
                    @click="doDelete(item.id)"
                >
                    <template #icon>
                        <icon-delete />
                    </template>
                </a-button>
            </div>
        </div>
        <div class="mt-2">
            <a-button size="small" @click="doAdd">
                <template #icon>
                    <icon-plus />
                </template>
                {{ $t("添加") }}
            </a-button>
        </div>
    </div>
</template>

<style scoped></style>
