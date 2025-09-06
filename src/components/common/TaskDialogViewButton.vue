<script setup lang="ts">
import AppsItemDialog from "../../pages/Apps/common/AppsItemDialog.vue";
import {ref} from "vue";

const props = defineProps<{
    taskId: string | number | undefined;
}>();
const itemDialog = ref<InstanceType<typeof AppsItemDialog>>();
</script>

<template>
    <a-button :disabled="!taskId" @click="itemDialog?.show(taskId as any)" size="small" class="w-full">
        <template #icon>
            <icon-tool />
        </template>
        <template v-if="taskId">
            {{ $t("查看任务") }}
            #{{ taskId }}
        </template>
        <template v-else>
            {{ $t("暂未运行") }}
        </template>
    </a-button>
    <AppsItemDialog ref="itemDialog" :title="$t('视频字幕')" />
</template>
