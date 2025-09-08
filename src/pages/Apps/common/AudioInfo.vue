<script setup lang="ts">

import {TimeUtil} from "../../../lib/util";

const props = defineProps<{
    data: {
        audioDuration?: number;
        audioChannels?: number;
        audioSampleRate?: number;
    }
}>();
</script>

<template>
    <a-tag class="rounded-lg" color="blue">
        <icon-file-audio/>
    </a-tag>
    <a-tag class="rounded-lg">时长 {{ TimeUtil.secondsToTime(data.audioDuration || 0) }}</a-tag>
    <a-tag class="rounded-lg">{{ data.audioChannels }} Channels</a-tag>
    <a-tag class="rounded-lg">{{ data.audioSampleRate }} Hz</a-tag>
</template>

<style scoped>

</style>
