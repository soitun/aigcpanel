<script setup lang="ts">
import { NodeProperties } from "../../core/type";

const props = defineProps<{
    properties: NodeProperties;
}>();
</script>

<template>
    <div class="flex items-center flex-wrap gap-1 mb-2">
        <a-tag class="rounded-lg truncate">
            {{
                properties?.data?.code
                    ? properties.data.code.substring(0, 50) + "..."
                    : "-"
            }}
        </a-tag>
    </div>
</template>
