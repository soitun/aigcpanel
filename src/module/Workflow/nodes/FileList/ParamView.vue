<script setup lang="ts">
import { NodeProperties } from "../../core/type";

const props = defineProps<{
    properties: NodeProperties;
}>();
</script>

<template>
    <div class="flex items-center flex-wrap gap-1 mb-2">
        <a-tag class="rounded-lg">
            {{ $t("列出文件夹") }}:
            {{ properties?.data?.folder || $t("未配置") }}
        </a-tag>
    </div>
</template>
