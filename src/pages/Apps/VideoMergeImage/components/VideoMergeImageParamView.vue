<script setup lang="ts">
const props = defineProps<{
    data: {
        position: "start" | "end";
        duration: number;
        animation: "none" | "zoom";
        zoomPercent?: number;
    };
}>();
</script>

<template>
    <div class="flex flex-wrap mb-2 gap-1">
        <a-tag class="rounded-lg">
            <icon-image />
            {{
                data.position
                    ? data.position === "start"
                        ? "片头图片"
                        : "片尾图片"
                    : "未配置"
            }}
        </a-tag>
        <a-tag class="rounded-lg">
            {{ data.duration !== undefined ? `${data.duration}秒` : "未配置" }}
        </a-tag>
        <a-tag v-if="data.animation === 'zoom'" class="rounded-lg">
            放大: {{ data.zoomPercent }}%
        </a-tag>
        <a-tag v-else-if="data.animation === 'none'" class="rounded-lg">
            无动画
        </a-tag>
    </div>
</template>
