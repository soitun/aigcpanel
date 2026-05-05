<script setup lang="ts">
import { ref } from "vue";
import InputInlineEditor from "../../../components/common/InputInlineEditor.vue";
import { Dialog } from "../../../lib/dialog";
import { TimeUtil } from "../../../lib/util";
import {
    getNodeStatusColor,
    getNodeStatusText,
} from "../../../module/Workflow/core/util";
import {
    WorkflowLogRecord,
    WorkflowLogService,
} from "../../../service/WorkflowService";
import WorkflowHistoryViewDialog from "./WorkflowHistoryViewDialog.vue";
import MEmpty from "../../../components/common/MEmpty.vue";

interface Props {
    workflowId: string;
}

const props = defineProps<Props>();

const visible = ref(false);
const historyRecords = ref<WorkflowLogRecord[]>([]);
const workflowHistoryViewDialog = ref<InstanceType<
    typeof WorkflowHistoryViewDialog
> | null>(null);

const show = () => {
    visible.value = true;
    doLoad();
};

const doLoad = async () => {
    if (!props.workflowId) return;
    historyRecords.value = await WorkflowLogService.listByWorkflowId(
        parseInt(props.workflowId),
    );
};

const doView = (record: WorkflowLogRecord) => {
    workflowHistoryViewDialog.value?.show(record);
};

const doDelete = async (record: WorkflowLogRecord) => {
    if (!record.id) return;
    await Dialog.confirm(
        "确定要删除这条运行记录吗？此操作不可恢复。",
        "确认删除",
    );
    await WorkflowLogService.delete(record.id);
    Dialog.tipSuccess("删除成功");
    await doLoad();
};

const doChangeName = async (
    record: WorkflowLogRecord,
    newName: string,
): Promise<boolean> => {
    if (!record.id) return false;
    try {
        await WorkflowLogService.update(record.id, { name: newName });
        Dialog.tipSuccess("名称更新成功");
        await doLoad();
        return true;
    } catch (error) {
        Dialog.tipError("更新失败");
        return false;
    }
};
defineExpose({
    show,
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="90vw"
        :footer="false"
        title-align="start"
    >
        <template #title>
            <div class="flex items-center">
                <div class="font-bold mr-2">
                    {{ $t("运行记录") }}
                </div>
            </div>
        </template>
        <div style="height: calc(100vh - 10rem)">
            <div class="space-y-4 pb-4">
                <div
                    v-for="record in historyRecords"
                    :key="record.id"
                    class="border border-gray-200 rounded-lg p-4"
                >
                    <div class="flex items-center gap-4">
                        <div class="w-10 flex-shrink-0">
                            #{{ record.seqId }}
                        </div>
                        <div class="flex-grow">
                            <div class="flex gap-1 items-center">
                                <div>{{ record.name || "[未命名]" }}</div>
                                <InputInlineEditor
                                    :value="record.name"
                                    :on-change-callback="
                                        (newName) =>
                                            doChangeName(record, newName)
                                    "
                                >
                                    <icon-edit class="text-gray-400" />
                                </InputInlineEditor>
                            </div>
                            <div class="text-xs text-gray-400">
                                开始：{{
                                    TimeUtil.format(record.startTime || 0)
                                }}
                            </div>
                            <div
                                v-if="record.endTime"
                                class="text-xs text-gray-400 mt-2"
                            >
                                结束：{{ TimeUtil.format(record.endTime) }}
                            </div>
                        </div>
                        <div class="w-48 flex-shrink-0">
                            <a-tag :color="getNodeStatusColor(record.status)">
                                {{ getNodeStatusText(record.status) }}
                            </a-tag>
                            <div class="text-xs text-gray-600 mt-2">
                                {{ record.statusMsg || "无状态信息" }}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <a-tooltip :content="$t('查看工作流')">
                                <a-button
                                    size="small"
                                    type="primary"
                                    @click="doView(record)"
                                >
                                    <template #icon>
                                        <icon-eye />
                                    </template>
                                </a-button>
                            </a-tooltip>
                            <a-tooltip :content="$t('删除记录')">
                                <a-button
                                    size="small"
                                    type="primary"
                                    status="danger"
                                    @click="doDelete(record)"
                                >
                                    <template #icon>
                                        <icon-delete />
                                    </template>
                                </a-button>
                            </a-tooltip>
                        </div>
                    </div>
                </div>
                <div
                    v-if="historyRecords.length === 0"
                    class="text-center text-gray-500 py-8"
                >
                    <m-empty />
                </div>
            </div>
        </div>
    </a-modal>

    <WorkflowHistoryViewDialog ref="workflowHistoryViewDialog" />
</template>
