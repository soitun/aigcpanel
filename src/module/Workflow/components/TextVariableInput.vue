<script setup lang="ts">
import { computed } from "vue";
import { listAllVariables } from "../core/variable";

const props = defineProps<{
    modelValue?: any;
    placeholder?: string;
    nodeId?: string;
    noFlag?: boolean;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: any];
    change: [value: any];
}>();

// 监听输入变化
const onInput = (value: any) => {
    emit("update:modelValue", value);
    emit("change", value);
};

// 获取所有变量
const variables = computed(() => {
    return listAllVariables(props.nodeId as any);
});

// 插入变量
const insertVariable = (v: string) => {
    if (!props.noFlag) {
        v = "${" + v + "}";
    }
    emit("update:modelValue", v);
    emit("change", v);
};
</script>

<template>
    <div class="text-variable-input">
        <div class="flex items-center space-x-2">
            <div class="flex-1">
                <a-input
                    size="small"
                    :model-value="modelValue"
                    :placeholder="placeholder || '输入文本或选择变量'"
                    @input="onInput"
                />
            </div>
            <a-dropdown v-if="variables.length">
                <a-button size="small">
                    <template #icon>
                        <icon-code />
                    </template>
                </a-button>
                <template #content>
                    <div class="p-1 max-h-64 overflow-y-auto text-xs">
                        <div
                            v-for="v in variables"
                            class="hover:bg-gray-200 p-1 rounded truncate cursor-pointer"
                            @click="
                                insertVariable(
                                    (v.node ? v.node + '.' : '') + v.name,
                                )
                            "
                            :key="(v.node ? v.node + '.' : '') + v.name"
                        >
                            {{
                                "${" +
                                (v.node ? v.node + "." : "") +
                                v.name +
                                "}"
                            }}
                        </div>
                    </div>
                </template>
            </a-dropdown>
        </div>
    </div>
</template>
