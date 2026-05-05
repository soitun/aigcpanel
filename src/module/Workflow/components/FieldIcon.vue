<script setup lang="ts">
import { computed } from "vue";
import { fieldTypeToColor } from "../core/field";
import { NodeField, NodeFieldType } from "../core/type";
import JsonIcon from "./icon/JsonIcon.vue";
import SelectIcon from "./icon/SelectIcon.vue";
import TextIcon from "./icon/TextIcon.vue";
import UnknownIcon from "./icon/UnknownIcon.vue";
import TextareaIcon from "./icon/TextareaIcon.vue";

const props = defineProps<{
    type: NodeFieldType;
    field: NodeField;
}>();
const icon = computed(() => {
    const field: NodeField = props.field || {};
    switch (props.type) {
        case "file":
            if (field.fileExtensions && field.fileExtensions.length) {
                if (field.fileExtensions.includes("mp4")) {
                    return "file-video";
                }
                if (field.fileExtensions.includes("mp3")) {
                    return "file-audio";
                }
                if (
                    field.fileExtensions.includes("jpg") ||
                    field.fileExtensions.includes("png") ||
                    field.fileExtensions.includes("gif")
                ) {
                    return "file-image";
                }
            }
            return "file";
        case "files":
            return "file";
        case "text":
            return "text";
        case "textarea":
            return "textarea";
        case "select":
            return "select";
        case "json":
            return "json";
        default:
            return "default";
    }
});
</script>

<template>
    <a-tag
        size="small"
        class="pb-file-icon rounded-lg"
        :color="fieldTypeToColor(type)"
    >
        <template #icon>
            <icon-file-video v-if="icon === 'file-video'" />
            <icon-file-audio v-else-if="icon === 'file-audio'" />
            <icon-file-image v-else-if="icon === 'file-image'" />
            <icon-file v-else-if="icon === 'file'" />
            <TextIcon v-else-if="icon === 'text'" class="w-4 h-4" />
            <TextareaIcon v-else-if="icon === 'textarea'" class="w-4 h-4" />
            <SelectIcon v-else-if="icon === 'select'" class="w-4 h-4" />
            <JsonIcon v-else-if="icon === 'json'" class="w-4 h-4" />
            <UnknownIcon v-else class="w-4 h-4" />
        </template>
    </a-tag>
</template>

<style lang="less" scoped>
.pb-file-icon {
    padding: 0px 3px;

    :deep(.arco-tag-icon) {
        margin-right: 0px;
    }
}
</style>

<script lang="ts">
export default {
    name: "FieldIcon",
};
</script>
