<template>
    <div
        class="p-2"
        v-if="runInputsWithFields.length || runOutputsWithFields.length"
    >
        <div class="font-bold pb-1">
            <icon-play-circle />
            {{ t("运行结果") }}
        </div>
        <div class="space-y-2">
            <div
                v-if="runInputsWithFields.length"
                class="border rounded-lg p-2"
            >
                <div class="font-medium text-sm mb-2 text-gray-700">
                    {{ t("输入") }}
                </div>
                <div class="space-y-2">
                    <div
                        v-for="item in runInputsWithFields"
                        :key="item.key"
                        class="border rounded p-2"
                    >
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex items-center">
                                <FieldIcon
                                    v-if="item.field"
                                    :type="item.field.type"
                                    :field="item.field"
                                    class="mr-1"
                                />
                                <a-tag size="small" class="rounded-lg">
                                    {{ item.key }}
                                </a-tag>
                            </div>
                            <div v-if="item.field" class="flex space-x-1">
                                <a-button
                                    @click="
                                        doCopy(
                                            getFieldValue(
                                                item.field,
                                                item.value,
                                            ),
                                        )
                                    "
                                    size="mini"
                                    shape="circle"
                                >
                                    <template #icon>
                                        <icon-copy />
                                    </template>
                                </a-button>
                                <a-button
                                    v-if="item.field.type === 'file'"
                                    @click="doSaveFile(item.value)"
                                    size="mini"
                                    shape="circle"
                                >
                                    <template #icon>
                                        <icon-download />
                                    </template>
                                </a-button>
                                <FieldPreviewButton
                                    v-if="item.field.type === 'file'"
                                    :field="item.field"
                                    :value="item.value"
                                />
                            </div>
                        </div>
                        <div
                            class="text-xs text-gray-600 whitespace-pre-wrap break-all bg-gray-50 p-2 rounded overflow-auto"
                        >
                            <pre v-if="typeof item.value === 'object'">{{
                                JSON.stringify(item.value, null, 2)
                            }}</pre>
                            <div v-else>{{ item.value }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-if="runOutputsWithFields.length"
                class="border rounded-lg p-2"
            >
                <div class="font-medium text-sm mb-2 text-gray-700">
                    {{ t("输出") }}
                </div>
                <div class="space-y-2">
                    <div
                        v-for="item in runOutputsWithFields"
                        :key="item.key"
                        class="border rounded p-2"
                    >
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex items-center">
                                <FieldIcon
                                    v-if="item.field"
                                    :type="item.field.type"
                                    :field="item.field"
                                    class="mr-1"
                                />
                                <a-tag size="small" class="rounded-lg">
                                    {{ item.key }}
                                </a-tag>
                            </div>
                            <div v-if="item.field" class="flex space-x-1">
                                <a-button
                                    @click="
                                        doCopy(
                                            getFieldValue(
                                                item.field,
                                                item.value,
                                            ),
                                        )
                                    "
                                    size="mini"
                                    shape="circle"
                                >
                                    <template #icon>
                                        <icon-copy />
                                    </template>
                                </a-button>
                                <a-button
                                    v-if="item.field.type === 'file'"
                                    @click="doSaveFile(item.value)"
                                    size="mini"
                                    shape="circle"
                                >
                                    <template #icon>
                                        <icon-download />
                                    </template>
                                </a-button>
                                <FieldPreviewButton
                                    v-if="item.field.type === 'file'"
                                    :field="item.field"
                                    :value="item.value"
                                />
                            </div>
                        </div>
                        <div
                            class="text-xs text-gray-600 whitespace-pre-wrap break-all bg-gray-50 p-2 rounded overflow-auto"
                        >
                            <pre v-if="typeof item.value === 'object'">{{
                                JSON.stringify(item.value, null, 2)
                            }}</pre>
                            <div v-else>{{ item.value }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { doCopy, doSaveFile } from "../../../components/common/util";
import { NodeField, NodeProperties } from "../core/type";
import FieldIcon from "./FieldIcon.vue";
import { t } from "../../../lang";
import FieldPreviewButton from "./FieldPreviewButton.vue";

const props = defineProps<{
    properties: NodeProperties;
}>();

const runInputsWithFields = computed(() => {
    const inputs = props.properties.runInputs || {};
    return Object.keys(inputs).map((key) => ({
        key,
        value: inputs[key],
        field: getFieldInfo(key, "input"),
    }));
});

const runOutputsWithFields = computed(() => {
    const outputs = props.properties.runOutputs || {};
    return Object.keys(outputs).map((key) => ({
        key,
        value: outputs[key],
        field: getFieldInfo(key, "output"),
    }));
});

const getFieldInfo = (
    key: string,
    type: "input" | "output",
): NodeField | null => {
    const fields =
        type === "input"
            ? props.properties.inputFields
            : props.properties.outputFields;
    if (!fields) return null;
    return fields.find((f) => f.name === key) || null;
};

const getFieldValue = (field: NodeField | null, value: any) => {
    if (!field) return value;
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    if (field.type === "files" && Array.isArray(value)) {
        return value.join(", ");
    }
    return value || field.defaultValue || t("空");
};
</script>

<script lang="ts">
export default {
    name: "NodeConfigPanelResult",
};
</script>
