<script setup lang="ts">
import { ref, watch } from "vue";
import TextVariableInput from "../../components/TextVariableInput.vue";
import { setNodePropertiesById } from "../../core/global";

const props = defineProps<{
    node: any;
    properties: any;
}>();

const variables = ref(
    props.properties?.data?.variables || [{ name: "", value: "" }],
);

const updateProperties = () => {
    setNodePropertiesById(props.node?.id, {
        data: {
            variables: variables.value,
        },
    });
};

const addVariable = () => {
    variables.value.push({ name: "", value: "" });
};

const removeVariable = (index: number) => {
    if (variables.value.length > 1) {
        variables.value.splice(index, 1);
    }
};

watch(variables, updateProperties, { deep: true, immediate: true });
</script>

<template>
    <div class="p-2">
        <div v-for="(varItem, index) in variables" :key="index" class="mb-2">
            <div class="flex items-center space-x-2">
                <TextVariableInput
                    v-model="varItem.name"
                    :placeholder="$t('名称')"
                    :node-id="node.id"
                    no-flag
                    class="flex-1"
                />
                <TextVariableInput
                    v-model="varItem.value"
                    :placeholder="$t('值')"
                    :node-id="node.id"
                    class="flex-1"
                />
                <a-button
                    size="small"
                    type="outline"
                    @click="removeVariable(index)"
                    v-if="variables.length > 1"
                >
                    <template #icon>
                        <icon-minus />
                    </template>
                </a-button>
            </div>
        </div>
        <a-button size="small" @click="addVariable">
            <icon-plus />
            添加变量
        </a-button>
    </div>
</template>
