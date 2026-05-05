<script setup lang="ts">
const props = defineProps<{
    data: {
        speed?: number;
    };
}>();
</script>

<template>
    <div class="flex flex-wrap mb-2 gap-1">
        <a-tag class="rounded-lg">{{
            data.speed ? `速度 ${data.speed}x` : "未配置"
        }}</a-tag>
    </div>
</template>
