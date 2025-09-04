<script setup lang="ts">
const props = defineProps<{
    taskId: string | number | undefined
}>()
</script>

<template>
    <a-button :disabled="!taskId"
              class="w-full">
        <template #icon>
            <icon-tool/>
        </template>
        <template v-if="taskId">
            {{ $t('查看任务') }}
            #{{ taskId }}
        </template>
        <template v-else>
            {{ $t('暂未运行') }}
        </template>
    </a-button>
</template>
