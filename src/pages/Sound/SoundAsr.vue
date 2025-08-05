<script setup lang="ts">
import { IconCopy, IconDown, IconDownload, IconEdit } from '@arco-design/web-vue/es/icon';
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ServerTaskResultParam from "../../components/Server/ServerTaskResultParam.vue";
import TaskBatchDeleteAction from "../../components/Server/TaskBatchDeleteAction.vue";
import TaskBatchDownloadAction from "../../components/Server/TaskBatchDownloadAction.vue";
import TaskCancelAction from "../../components/Server/TaskCancelAction.vue";
import TaskDeleteAction from "../../components/Server/TaskDeleteAction.vue";
import TaskDuration from "../../components/Server/TaskDuration.vue";
import TaskTitleField from "../../components/Server/TaskTitleField.vue";
import TaskBizStatus from "../../components/common/TaskBizStatus.vue";
import { useCheckAll } from "../../components/common/check-all";
import { Dialog } from "../../lib/dialog";
import { TaskRecord, TaskService } from "../../service/TaskService";
import { TaskChangeType, useTaskStore } from "../../store/modules/task";
import SoundAsrCreate from "./components/SoundAsrCreate.vue";
import SoundAsrRecordsEditDialog from "./components/SoundAsrRecordsEditDialog.vue";

interface AsrRecord {
    start: number;
    end: number;
    text: string;
}

interface AsrResult {
    text?: string;
    records?: AsrRecord[];
}

const records = ref<TaskRecord[]>([]);
const taskStore = useTaskStore();
const soundAsrRecordsEditDialog = ref<InstanceType<typeof SoundAsrRecordsEditDialog> | null>(null);
const expandedTexts = ref<Set<string>>(new Set());

const page = ref(1);
const recordsForPage = computed(() => {
    return records.value.slice((page.value - 1) * 10, page.value * 10);
});

const taskChangeCallback = (bizId: string, type: TaskChangeType) => {
    doRefresh();
};

onMounted(async () => {
    await doRefresh();
    taskStore.onChange("SoundAsr", taskChangeCallback);
});

onBeforeUnmount(() => {
    taskStore.offChange("SoundAsr", taskChangeCallback);
});

const { mergeCheck, isIndeterminate, isAllChecked, onCheckAll, checkRecords } = useCheckAll({
    records: recordsForPage,
});

const doRefresh = async () => {
    records.value = mergeCheck(await TaskService.list("SoundAsr"));
};

const onCreateSubmitted = () => {
    doRefresh();
};

// 切换文本展开状态
const toggleTextExpanded = (taskId: string) => {
    if (expandedTexts.value.has(taskId)) {
        expandedTexts.value.delete(taskId);
    } else {
        expandedTexts.value.add(taskId);
    }
};

// 检查文本是否需要截断
const needsTruncate = (text: string) => {
    return text.length > 200;
};

// 获取显示的文本
const getDisplayText = (text: string, taskId: string) => {
    if (!needsTruncate(text) || expandedTexts.value.has(taskId)) {
        return text;
    }
    return text.substring(0, 200) + '...';
};

// 获取结果数据
const getRecords = (result: any): AsrRecord[] => {
    if (!result) return [];

    // 如果直接是数组格式
    if (Array.isArray(result)) {
        return result;
    }

    // 如果有records字段
    if (result.records && Array.isArray(result.records)) {
        return result.records;
    }

    return [];
};

// 获取拼接文本
const getConcatText = (result: any): string => {
    if (!result) return '';

    // 如果有直接的text字段
    if (result.text) {
        return result.text;
    }

    // 从records中拼接
    const records = getRecords(result);
    return records.map(r => r.text).join('');
};

// 时间格式化
const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

// 生成SRT格式字幕
const generateSRT = (records: AsrRecord[]): string => {
    return records.map((record, index) => {
        const startTime = formatSRTTime(record.start);
        const endTime = formatSRTTime(record.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${record.text}\n`;
    }).join('\n');
};

const formatSRTTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
};

// 操作结果的方法
const copyResultText = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record) {
        const text = getConcatText(record.result);
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                Dialog.tipSuccess('已复制到剪贴板');
            }).catch(() => {
                Dialog.tipError('复制失败');
            });
        }
    }
};

const downloadResultText = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record) {
        const text = getConcatText(record.result);
        if (text) {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${record.title || 'asr-result'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
};

const downloadResultSubtitle = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record) {
        const asrRecords = getRecords(record.result);
        if (asrRecords.length > 0) {
            const srtContent = generateSRT(asrRecords);
            const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${record.title || 'asr-result'}.srt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
};

const editResult = (taskId: string) => {
    const record = records.value.find(r => String(r.id) === taskId);
    if (record) {
        const asrRecords = getRecords(record.result);
        soundAsrRecordsEditDialog.value?.edit(asrRecords, taskId);
    }
};

// 保存编辑结果
const onEditSave = async (editedRecords: AsrRecord[], taskId?: string) => {
    try {
        if (!taskId) return;

        // 更新本地记录
        const record = records.value.find(r => String(r.id) === taskId);
        if (record && record.result) {
            record.result = {
                ...record.result,
                records: editedRecords
            };
        }

        await TaskService.update(taskId, {
            result: {
                records: editedRecords
            }
        });

        Dialog.tipSuccess('保存成功');
    } catch (error) {
        console.error('保存编辑结果失败:', error);
        Dialog.tipError('保存失败');
    }
};
</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t("语音识别") }}
            </div>
        </div>
        <div>
            <SoundAsrCreate @submitted="onCreateSubmitted" />
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

                        <!-- 结果显示区域 -->
                        <div v-if="r.result && (r.result.records)" class="mt-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <!-- 拼接文本显示 -->
                                <div class="mb-3">
                                    <div class="bg-white rounded p-3 border">
                                        <div class="whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
                                            @click="copyResultText(String(r.id))">
                                            {{ getDisplayText(getConcatText(r.result) || $t("暂无识别结果"), String(r.id)) }}
                                        </div>
                                        <div v-if="needsTruncate(getConcatText(r.result) || '')"
                                            class="mt-2 text-center">
                                            <a-button size="mini" type="text" @click="toggleTextExpanded(String(r.id))">
                                                {{ expandedTexts.has(String(r.id)) ? $t("收起") : $t("更多") }}
                                            </a-button>
                                        </div>
                                    </div>
                                </div>

                                <!-- 详细记录列表 -->
                                <div v-if="getRecords(r.result).length > 0">
                                    <div class="text-sm text-gray-600 mb-2">
                                        {{ $t("详细记录") }} ({{ getRecords(r.result).length }} {{ $t("条") }})
                                    </div>
                                    <div class="space-y-2 max-h-48 overflow-y-auto">
                                        <div v-for="(record, index) in getRecords(r.result).slice(0, 5)" :key="index"
                                            class="flex items-start space-x-3 text-sm">
                                            <div class="text-gray-500 w-16 flex-shrink-0">
                                                {{ formatTime(record.start) }}
                                            </div>
                                            <div class="flex-1">{{ record.text }}</div>
                                        </div>
                                        <div v-if="getRecords(r.result).length > 5"
                                            class="text-center text-gray-500 text-sm py-2">
                                            {{ $t("还有") }} {{ getRecords(r.result).length - 5 }} {{ $t("条记录") }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="pt-4 flex items-center">
                            <div class="text-gray-400 flex-grow">
                                <timeago :datetime="r['createdAt'] * 1000" />
                            </div>
                            <div class="">
                                <a-tooltip v-if="r.result && r.result.records" :content="$t('复制文本')" mini>
                                    <a-button class="mr-2" @click="copyResultText(String(r.id))" title="复制识别结果">
                                        <template #icon>
                                            <icon-copy />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip v-if="r.result && r.result.records" :content="$t('下载')" mini>
                                    <a-dropdown-button class="mr-2">
                                        <icon-download />
                                        <template #icon>
                                            <icon-down />
                                        </template>
                                        <template #content>
                                            <a-doption @click="downloadResultText(String(r.id))">
                                                {{ $t('下载文本文件') }}
                                            </a-doption>
                                            <a-doption @click="downloadResultSubtitle(String(r.id))">
                                                {{ $t('下载字幕文件') }}
                                            </a-doption>
                                        </template>
                                    </a-dropdown-button>
                                </a-tooltip>
                                <a-tooltip v-if="r.result && r.result.records" :content="$t('编辑')" mini>
                                    <a-button class="mr-2" @click="editResult(String(r.id))" title="编辑识别结果">
                                        <template #icon>
                                            <icon-edit />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <TaskDeleteAction :record="r" @update="doRefresh" />
                                <TaskCancelAction :record="r" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <m-empty v-else :text="$t('暂无语音识别任务')" />
        </div>

        <!-- 编辑弹窗 -->
        <SoundAsrRecordsEditDialog ref="soundAsrRecordsEditDialog" @save="onEditSave" />
    </div>
</template>
