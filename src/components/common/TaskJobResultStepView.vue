<script setup lang="ts">
import {TaskJobResultStepStatus, TaskRecord} from "../../service/TaskService";
import {computed} from "vue";

const props = defineProps<{
    record: TaskRecord,
    step: string,
}>();
const stepData = computed(() => {
    return props.record.jobResult?.[props.step] as {
        status: TaskJobResultStepStatus,
    }
})
</script>

<template>
    <div v-if="stepData && stepData.status==='success'">
        <slot></slot>
    </div>
    <div v-else-if="stepData && stepData.status==='pending'">
        <slot></slot>
        <slot name="pending"></slot>
    </div>
    <div v-else-if="stepData && stepData.status === 'running' && record.status==='running'"
         class="bg-gray-100 rounded-lg p-1">
        <div class="text-gray-400 text-xs">
            <icon-refresh spin/>
            {{ $t("处理中") }}
        </div>
    </div>
    <div v-else-if="stepData && stepData.status === 'running' && record.status==='fail'"
         class="bg-gray-100 rounded-lg p-1">
        <div class="text-red-400 text-xs">
            <icon-info-circle/>
            {{ $t("处理出错") }}
        </div>
    </div>
    <div v-else-if="stepData && stepData.status === 'fail'"
         class="bg-gray-100 rounded-lg p-1">
        <div class="text-red-400 text-xs">
            <icon-info-circle/>
            {{ $t("处理出错") }}
        </div>
    </div>
    <div v-else class="bg-gray-100 rounded-lg p-1">
        <div class="text-gray-400 text-xs">
            <icon-info-circle/>
            {{ $t("未处理") }}
        </div>
    </div>
</template>

<style scoped>

</style>
