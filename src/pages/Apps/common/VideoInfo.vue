<script setup lang="ts">

import {TimeUtil} from "../../../lib/util";

const props = defineProps<{
    data: {
        videoWidth: number;
        videoHeight: number;
        videoDuration: number;
        videoFps: number;
        width?: number;
        height?: number;
        duration?: number;
        fps?: number;
    }
}>();
</script>

<template>
    <a-tag class="rounded-lg" color="blue">
        <icon-file-video/>
    </a-tag>
    <a-tag class="rounded-lg">分辨率 {{ data.width || data.videoWidth }} x {{ data.height || data.videoHeight }}</a-tag>
    <a-tag class="rounded-lg">时长 {{ TimeUtil.secondsToTime(data.duration || data.videoDuration || 0) }}</a-tag>
    <a-tag class="rounded-lg">{{ (data.fps || data.videoFps || 0).toFixed(2) }} FPS</a-tag>
</template>

<style scoped>

</style>
