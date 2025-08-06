<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ServerTaskResultParam from '../../../components/Server/ServerTaskResultParam.vue';
import TaskBatchDeleteAction from '../../../components/Server/TaskBatchDeleteAction.vue';
import TaskBatchDownloadAction from '../../../components/Server/TaskBatchDownloadAction.vue';
import TaskCancelAction from '../../../components/Server/TaskCancelAction.vue';
import TaskContinueAction from '../../../components/Server/TaskContinueAction.vue';
import TaskDeleteAction from '../../../components/Server/TaskDeleteAction.vue';
import TaskDuration from '../../../components/Server/TaskDuration.vue';
import TaskRetryAction from '../../../components/Server/TaskRetryAction.vue';
import TaskTitleField from '../../../components/Server/TaskTitleField.vue';
import TaskBizStatus from '../../../components/common/TaskBizStatus.vue';
import { useCheckAll } from '../../../components/common/check-all';
import { doCopy } from "../../../components/common/util";
import { Dialog } from "../../../lib/dialog";
import { DownloadUtil } from "../../../lib/util";
import { TaskRecord, TaskService } from "../../../service/TaskService";
import SoundAsrRecordsEditDialog from "../../Sound/components/SoundAsrRecordsEditDialog.vue";
import { usePaginate } from '../../hooks/paginate';
import { useTaskChangeRefresh } from '../../hooks/task';
import SoundReplaceCreate from './components/SoundReplaceCreate.vue';
import StepsComponent from './components/StepsComponent.vue';

interface AsrRecord {
    start: number;
    end: number;
    text: string;
}

interface ProcessedTaskRecord extends TaskRecord {
    _concatText?: string;
    _concatTextTruncate?: string;
    _asrRecords?: AsrRecord[];
    _needsTruncate?: boolean;
    _isTextExpanded?: boolean;
}

const soundAsrRecordsEditDialog = ref<InstanceType<typeof SoundAsrRecordsEditDialog> | null>(null);

const {
    page,
    records,
    recordsForPage,
} = usePaginate<ProcessedTaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh('SoundReplace', () => {
    doRefresh();
});

const { mergeCheck, isIndeterminate, isAllChecked, onCheckAll, checkRecords } = useCheckAll({
    records: recordsForPage,
});

const stepsVisible = ref(false);

onMounted(async () => {
    await doRefresh();
});

const doRefresh = async () => {
    const rawRecords = await TaskService.list("SoundReplace");
    // 预处理数据，避免模板中重复计算
    const processedRecords = rawRecords.map(record => {
        // 内联 getRecords 逻辑
        let _asrRecords: AsrRecord[] = [];
        let _concatText = '';
        if (record.result && record.result.records && Array.isArray(record.result.records)) {
            _asrRecords = record.result.records;
            _concatText = _asrRecords.map(r => r.text).join('');
        }

        const _needsTruncate = _concatText.length > 200;
        const _concatTextTruncate = _needsTruncate ? _concatText.substring(0, 200) + '...' : _concatText;
        const _isTextExpanded = false; // 默认收起状态

        return {
            ...record,
            _asrRecords,
            _concatText,
            _concatTextTruncate,
            _needsTruncate,
            _isTextExpanded
        } as ProcessedTaskRecord;
    });

    records.value = mergeCheck(processedRecords);
};

// SRT 时间格式化（简化版）
const formatSRTTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
};

// 操作结果的方法（简化版）
const onCopyResultText = async (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record?._concatText) {
        try {
            await doCopy(record._concatText, '已复制到剪贴板');
        } catch (error) {
            Dialog.tipError('复制失败');
        }
    }
};

const onDownloadResultText = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record?._concatText) {
        DownloadUtil.downloadFile(record._concatText, `${record.title || 'asr-result'}.txt`);
    }
};

const onDownloadResultSubtitle = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record?._asrRecords?.length) {
        // 内联 generateSRT 逻辑
        const srtContent = record._asrRecords.map((asrRecord, index) =>
            `${index + 1}\n${formatSRTTime(asrRecord.start)} --> ${formatSRTTime(asrRecord.end)}\n${asrRecord.text}\n`
        ).join('\n');
        DownloadUtil.downloadFile(srtContent, `${record.title || 'asr-result'}.srt`);
    }
};

const onEditResult = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record?._asrRecords) {
        soundAsrRecordsEditDialog.value?.edit(record._asrRecords, taskId);
    }
};

const onToggleTextExpanded = (record: ProcessedTaskRecord) => {
    record._isTextExpanded = !record._isTextExpanded;
};
</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">声音替换</div>
            <a-button @click="stepsVisible = !stepsVisible" size="small" class="ml-2">
                <template #icon>
                    <icon-up v-if="!stepsVisible" />
                    <icon-down v-else />
                </template>
                说明
            </a-button>
        </div>
        <StepsComponent v-if="stepsVisible" />
        <div>
            <SoundReplaceCreate @submitted="doRefresh" />
            <div v-if="records.length > 0">
                <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg flex items-center">
                    <div class="flex-grow flex items-center">
                        <div class="mr-3">
                            <a-checkbox :model-value="isAllChecked" :indeterminate="isIndeterminate"
                                @change="onCheckAll">
                                {{ $t("全选") }}
                            </a-checkbox>
                        </div>
                        <TaskBatchDeleteAction :records="checkRecords" @update="doRefresh" />
                        <TaskBatchDownloadAction :records="checkRecords" />
                    </div>
                    <div>
                        <a-pagination v-model:current="page" :total="records.length" :page-size="10" show-total
                            simple />
                    </div>
                </div>
                <div v-for="r in recordsForPage" :key="r.id">
                    <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                        <div class="flex items-center">
                            <div class="inline-flex items-start bg-blue-100 rounded-full px-2 leading-8 h-8 mr-2">
                                <div class="mr-2 h-8 pt-0.5">
                                    <a-checkbox v-model="r['_check']" />
                                </div>
                                <div class="">
                                    <TaskTitleField :record="r" @title-click="r['_check'] = !r['_check']"
                                        @update="v => (r.title = v)" />
                                </div>
                            </div>
                            <div class="flex-grow"></div>
                            <div class="ml-1">
                                <TaskDuration :start="r.startTime" :end="r.endTime" />
                            </div>
                            <div class="ml-1">
                                <TaskBizStatus :status="r.status" :status-msg="r.statusMsg" />
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                <i class="iconfont icon-sound-asr"></i>
                                {{ $t("语音识别") }}
                            </div>
                            <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                <i class="iconfont icon-server mr-1"></i>
                                {{ r.serverTitle }}
                                v{{ r.serverVersion }}
                            </div>
                            <div v-if="r.modelConfig?.model"
                                class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6">
                                <i class="iconfont icon-model mr-1"></i>
                                {{ r.modelConfig.model }}
                            </div>
                            <ServerTaskResultParam :record="r as any" />
                        </div>

                        <div v-if="r.result && r._asrRecords" class="mt-4">
                            <div class="bg-gray-100 rounded-lg p-2">
                                <div class="whitespace-pre-wrap cursor-pointer p-2 rounded-lg">
                                    {{ (r._isTextExpanded ? r._concatText : r._concatTextTruncate) || $t("暂无识别结果") }}
                                    <a-button size="mini" v-if="r._needsTruncate" @click="onToggleTextExpanded(r)">
                                        {{ r._isTextExpanded ? $t("收起") : $t("更多") }}
                                    </a-button>
                                </div>
                            </div>
                        </div>

                        <div class="pt-4 flex items-center">
                            <div class="text-gray-400 flex-grow">
                                <timeago :datetime="r['createdAt'] * 1000" />
                            </div>
                            <div class="">
                                <a-tooltip v-if="r.result && r._asrRecords" :content="$t('复制文本')" mini>
                                    <a-button class="mr-2" @click="onCopyResultText(String(r.id))" title="复制识别结果">
                                        <template #icon>
                                            <icon-copy />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip v-if="r.result && r._asrRecords" :content="$t('下载')" mini>
                                    <a-dropdown-button class="mr-2">
                                        <icon-download />
                                        <template #icon>
                                            <icon-down />
                                        </template>
                                        <template #content>
                                            <a-doption @click="onDownloadResultText(String(r.id))">
                                                {{ $t('下载文本文件') }}
                                            </a-doption>
                                            <a-doption @click="onDownloadResultSubtitle(String(r.id))">
                                                {{ $t('下载字幕文件') }}
                                            </a-doption>
                                        </template>
                                    </a-dropdown-button>
                                </a-tooltip>
                                <a-tooltip v-if="r.result && r._asrRecords" :content="$t('编辑')" mini>
                                    <a-button class="mr-2" @click="onEditResult(String(r.id))" title="编辑识别结果">
                                        <template #icon>
                                            <icon-edit />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <TaskDeleteAction :record="r" @update="doRefresh" />
                                <TaskCancelAction :record="r" />
                                <TaskRetryAction :record="r" @update="doRefresh" />
                                <TaskContinueAction :record="r" @update="doRefresh" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <m-empty v-else :text="$t('暂无语音识别任务')" />
        </div>
    </div>
</template>
