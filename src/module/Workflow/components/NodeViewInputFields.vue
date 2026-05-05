<script setup lang="ts">
import { t } from "../../../lang";
import { NodeField } from "../core/type";
import FieldIcon from "./FieldIcon.vue";

const props = defineProps<{
    properties?: {
        inputFields?: NodeField[];
    };
    emptyText?: string;
}>();

const viewField = (field: NodeField) => {
    if (typeof field.value === "object") {
        return JSON.stringify(field.value);
    }
    if (field.type === "files" && Array.isArray(field.value)) {
        return field.value.join(", ");
    }
    return field.value || field.defaultValue || t("空");
};
</script>

<template>
    <div v-if="properties?.inputFields && properties.inputFields.length">
        <div
            v-for="field in properties.inputFields"
            :key="field.name"
            class="mb-2"
        >
            <div class="flex items-center text-xs mb-1 gap-1">
                <FieldIcon :type="field.type" :field="field" />
                <div class="flex-grow">{{ field.name }}</div>
            </div>
            <a-tooltip placement="top" :content="viewField(field)">
                <div class="text-xs bg-gray-100 p-2 rounded truncate">
                    {{ viewField(field) }}
                </div>
            </a-tooltip>
        </div>
    </div>
    <div
        v-else-if="!!emptyText"
        class="text-center bg-gray-100 rounded-lg text-xs p-2"
    >
        {{ emptyText }}
    </div>
</template>

<style scoped></style>
