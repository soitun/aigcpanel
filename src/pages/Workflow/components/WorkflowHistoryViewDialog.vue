<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { WorkflowLogRecord } from "../../../service/WorkflowService";
import WorkflowEditor from "../../../module/Workflow/WorkflowEditor.vue";
import { TimeUtil } from "../../../lib/util";
import {
    getNodeStatusColor,
    getNodeStatusText,
} from "../../../module/Workflow/core/util";

const visible = ref(false);
const record = ref<WorkflowLogRecord | null>(null);
const workflowEditor = ref<InstanceType<typeof WorkflowEditor> | null>(null);

watch(visible, async (val) => {
    if (val && record.value?.data) {
        await nextTick();
        workflowEditor.value?.setData(record.value.data);
    }
});

const show = (logRecord: WorkflowLogRecord) => {
    record.value = logRecord;
    visible.value = true;
};

defineExpose({ show });
</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="95vw"
        :footer="false"
        title-align="start"
    >
        <template #title>
            <div class="font-bold">
                {{ $t("运行记录详情") }}
                <span
                    v-if="record?.seqId"
                    class="text-gray-400 font-normal ml-2"
                    >#{{ record.seqId }}</span
                >
            </div>
        </template>
        <div
            style="height: calc(100vh - 12rem)"
            class="-mx-4 -mb-4 flex flex-col"
        >
            <div
                class="px-4 py-2 flex items-center gap-4 border-b border-gray-100 text-sm flex-shrink-0"
            >
                <a-tag :color="getNodeStatusColor(record?.status || 'idle')">
                    {{ getNodeStatusText(record?.status || "idle") }}
                </a-tag>
                <div class="text-gray-500">
                    开始：{{ TimeUtil.format(record?.startTime || 0) }}
                </div>
                <div v-if="record?.endTime" class="text-gray-500">
                    结束：{{ TimeUtil.format(record?.endTime) }}
                </div>
                <div v-if="record?.statusMsg" class="text-gray-500">
                    {{ record.statusMsg }}
                </div>
            </div>
            <div class="flex-1 min-h-0">
                <WorkflowEditor
                    ref="workflowEditor"
                    instance-name="history"
                    :readonly="true"
                />
            </div>
        </div>
    </a-modal>
</template>
