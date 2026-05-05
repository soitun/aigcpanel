<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    data: {
        targetWidth?: number;
        targetHeight?: number;
        fillMode?: string;
    };
}>();

const fillModeMap = {
    blur: "模糊填充",
    black: "黑边填充",
    crop: "裁剪填充",
    stretch: "拉伸填充",
};

const fillModeText = computed(() => {
    const mode = props.data.fillMode;
    return fillModeMap[mode as keyof typeof fillModeMap] || mode;
});
</script>

<template>
    <div class="flex flex-wrap mb-2 gap-1">
        <a-tag class="rounded-lg">{{
            data.targetWidth && data.targetHeight
                ? `${data.targetWidth}x${data.targetHeight} (${fillModeText})`
                : "未配置"
        }}</a-tag>
    </div>
</template>
