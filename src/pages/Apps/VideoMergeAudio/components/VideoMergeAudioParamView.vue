<script setup lang="ts">
const props = defineProps<{
    data: {
        volume?: number;
        loopAudio?: boolean;
        fadeInTime?: number;
        fadeOutTime?: number;
    };
}>();
</script>

<template>
    <div class="flex flex-wrap mb-2 gap-1">
        <a-tag class="rounded-lg"
            >音量
            {{
                data.volume !== undefined ? `${data.volume}%` : "未配置"
            }}</a-tag
        >
        <a-tag class="rounded-lg"
            >循环音频
            {{
                data.loopAudio !== undefined
                    ? data.loopAudio
                        ? "是"
                        : "否"
                    : "未配置"
            }}</a-tag
        >
        <a-tag class="rounded-lg"
            >淡入时间
            {{
                data.fadeInTime !== undefined
                    ? `${data.fadeInTime}ms`
                    : "未配置"
            }}</a-tag
        >
        <a-tag class="rounded-lg"
            >淡出时间
            {{
                data.fadeOutTime !== undefined
                    ? `${data.fadeOutTime}ms`
                    : "未配置"
            }}</a-tag
        >
    </div>
</template>
