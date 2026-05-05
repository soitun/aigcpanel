<script setup lang="ts">
const props = defineProps<{
    data: {
        zoomDurationMs?: number;
    };
}>();
</script>

<template>
    <div class="flex flex-wrap mb-2 gap-1">
        <a-tag class="rounded-lg"
            >放大持续时间
            {{
                data.zoomDurationMs ? data.zoomDurationMs + "ms" : "未配置"
            }}</a-tag
        >
    </div>
</template>
