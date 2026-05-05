<script setup lang="ts">
import { NodeProperties } from "../../core/type";

const props = defineProps<{
    properties: NodeProperties;
}>();
</script>

<template>
    <div class="flex items-center flex-wrap gap-1 mb-2">
        <a-tag class="rounded-lg">
            {{ $t("目标文件存在时") }}:{{
                properties?.data?.overwrite ? $t("覆盖") : $t("同时保留")
            }}
        </a-tag>
    </div>
</template>
