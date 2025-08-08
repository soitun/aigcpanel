<script setup lang="ts">
import {PropType} from "vue";

const props = defineProps({
    record: {
        type: Object as PropType<{
            serverTitle: string;
            serverVersion: string;
        }>,
        required: true,
    },
});
</script>

<template>
    <a-tag class="rounded-lg mr-1">
        <i class="iconfont icon-server mr-1"></i>
        {{ props.record.serverTitle }}
        v{{ props.record.serverVersion }}
    </a-tag>
</template>

<style scoped></style>
