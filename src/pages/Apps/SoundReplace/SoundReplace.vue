<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import ServerTaskResultParam from "../../../components/Server/ServerTaskResultParam.vue";
import TaskBatchDeleteAction from "../../../components/Server/TaskBatchDeleteAction.vue";
import TaskBatchDownloadAction from "../../../components/Server/TaskBatchDownloadAction.vue";
import TaskContinueAction from "../../../components/Server/TaskContinueAction.vue";
import TaskDeleteAction from "../../../components/Server/TaskDeleteAction.vue";
import TaskDownloadAction from "../../../components/Server/TaskDownloadAction.vue";
import TaskDuration from "../../../components/Server/TaskDuration.vue";
import TaskRetryAction from "../../../components/Server/TaskRetryAction.vue";
import TaskTitleField from "../../../components/Server/TaskTitleField.vue";
import TextTruncateView from "../../../components/TextTruncateView.vue";
import AudioPlayer from "../../../components/common/AudioPlayer.vue";
import AudioPlayerButton from "../../../components/common/AudioPlayerButton.vue";
import TaskBizStatus from "../../../components/common/TaskBizStatus.vue";
import VideoPlayer from "../../../components/common/VideoPlayer.vue";
import {useCheckAll} from "../../../components/common/check-all";
import {TaskRecord, TaskService} from "../../../service/TaskService";
import {useTaskStore} from "../../../store/modules/task";
import SoundAsrRecordsEditDialog from "../../Sound/components/SoundAsrRecordsEditDialog.vue";
import {usePaginate} from "../../../hooks/paginate";
import {useTaskChangeRefresh} from "../../../hooks/task";
import SoundReplaceCreate from "./components/SoundReplaceCreate.vue";
import StepsComponent from "./components/StepsComponent.vue";
import {soundReplaceFileCleanCollector} from "./util";

const soundAsrRecordsEditDialog = ref<InstanceType<typeof SoundAsrRecordsEditDialog> | null>(null);
const taskStore = useTaskStore();

const {page, records, recordsForPage} = usePaginate<TaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh("SoundReplace", () => {
    doRefresh();
});

const {mergeCheck, isIndeterminate, isAllChecked, onCheckAll, checkRecords} = useCheckAll({
    records: recordsForPage,
});

const stepsVisible = ref(false);

onMounted(async () => {
    await doRefresh();
});

const doRefresh = async () => {
    const rawRecords = await TaskService.list("SoundReplace");
    const processRecords = rawRecords.map(r => {
        r.runtime = {
            SoundAsr: {
                text: computed(() => {
                    if (r.jobResult.SoundAsr && r.jobResult.SoundAsr.records) {
                        return r.jobResult.SoundAsr.records.map(item => item.text).join(" ");
                    }
                    return "";
                }),
            },
            Confirm: {
                text: computed(() => {
                    if (r.jobResult.Confirm && r.jobResult.Confirm.records) {
                        return r.jobResult.Confirm.records.map(item => item.text).join(" ");
                    }
                    return "";
                }),
            },
            SoundGenerate: {
                showTruncate: true,
            },
        };
        return r;
    });
    records.value = mergeCheck(processRecords);
};

const onAsrRecordsUpdate = async (taskId: number, records: any[]) => {
    await TaskService.update(taskId, {
        statusMsg: "",
        jobResult: {
            step: "SoundGenerate",
            Confirm: {
                records,
                confirm: true,
            },
        },
    });
    await taskStore.dispatch("SoundReplace", taskId + "");
};
</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">{{ $t("声音替换") }}</div>
                <div class="text-gray-400 ml-3">{{ $t("使用新声音替换已有视频的声音") }}</div>
            </div>
            <a-button @click="stepsVisible = !stepsVisible" size="small" class="ml-2">
                <template #icon>
                    <icon-up v-if="!stepsVisible" />
                    <icon-down v-else />
                </template>
                {{ $t("说明") }}
            </a-button>
        </div>
        <StepsComponent v-if="stepsVisible" />
        <div>
            <SoundReplaceCreate @submitted="doRefresh" />
            <div v-if="records.length > 0">
                <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg flex items-center">
                    <div class="flex-grow flex items-center">
                        <div class="mr-3">
                            <a-checkbox
                                :model-value="isAllChecked"
                                :indeterminate="isIndeterminate"
                                @change="onCheckAll"
                            >
                                {{ $t("全选") }}
                            </a-checkbox>
                        </div>
                        <TaskBatchDeleteAction
                            :records="checkRecords"
                            @update="doRefresh"
                            :file-clean-collector="soundReplaceFileCleanCollector"
                        />
                        <TaskBatchDownloadAction :records="checkRecords" />
                    </div>
                    <div>
                        <a-pagination
                            v-model:current="page"
                            :total="records.length"
                            :page-size="10"
                            show-total
                            simple
                        />
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
                                    <TaskTitleField
                                        :record="r"
                                        @title-click="r['_check'] = !r['_check']"
                                        @update="v => (r.title = v)"
                                    />
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
                        <div v-if="r.jobResult.ToAudio && r.jobResult.ToAudio.file" class="mt-3 flex">
                            <div class="w-32 flex-shrink-0">
                                <div
                                    class="inline-block text-center mr-2 bg-gray-100 w-6 rounded-full px-1 leading-6 h-6"
                                >
                                    1
                                </div>
                                <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                    <i class="iconfont icon-sound"></i>
                                    {{ $t("提取音频") }}
                                </div>
                            </div>
                            <div class="flex-grow">
                                <AudioPlayer :url="r.jobResult.ToAudio.file" show-wave />
                            </div>
                        </div>
                        <div v-if="r.jobResult.SoundAsr && r.jobResult.SoundAsr.records" class="mt-3 flex">
                            <div class="w-32 flex-shrink-0">
                                <div
                                    class="inline-block text-center mr-2 bg-gray-100 w-6 rounded-full px-1 leading-6 h-6"
                                >
                                    2
                                </div>
                                <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                    <i class="iconfont icon-asr"></i>
                                    {{ $t("语音转写") }}
                                </div>
                            </div>
                            <div class="flex-grow">
                                <div>
                                    <div class="bg-gray-100 rounded-lg p-2">
                                        <TextTruncateView :max-length="40" :text="r.runtime?.SoundAsr.text" />
                                    </div>
                                </div>
                                <div class="mt-1">
                                    <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                        <i class="iconfont icon-server mr-1"></i>
                                        {{ r.modelConfig.soundAsr.serverTitle }}
                                        v{{ r.modelConfig.soundAsr.serverVersion }}
                                    </div>
                                    <div
                                        v-if="r.modelConfig?.model"
                                        class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6"
                                    >
                                        <i class="iconfont icon-model mr-1"></i>
                                        {{ r.modelConfig.model }}
                                    </div>
                                    <ServerTaskResultParam :record="r as any" />
                                </div>
                            </div>
                        </div>
                        <div v-if="r.jobResult.Confirm && r.jobResult.Confirm.records" class="mt-3 flex">
                            <div class="w-32 flex-shrink-0">
                                <div
                                    class="inline-block text-center mr-2 bg-gray-100 w-6 rounded-full px-1 leading-6 h-6"
                                >
                                    3
                                </div>
                                <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                    <i class="iconfont icon-asr"></i>
                                    {{ $t("重排确认") }}
                                </div>
                            </div>
                            <div class="flex-grow">
                                <div class="mb-1">
                                    <div class="bg-gray-100 rounded-lg p-2">
                                        <TextTruncateView :max-length="40" :text="r.runtime?.Confirm.text" />
                                    </div>
                                </div>
                                <div v-if="!r.jobResult.Confirm.confirm">
                                    <a-button
                                        type="primary"
                                        @click="
                                            soundAsrRecordsEditDialog?.edit(r.id as any, r.jobResult.Confirm.records)
                                        "
                                    >
                                        <template #icon>
                                            <icon-check-circle />
                                        </template>
                                        {{ $t("修改确认文字") }}
                                    </a-button>
                                </div>
                                <div v-else>
                                    <a-button :disabled="true">
                                        <template #icon>
                                            <icon-check />
                                        </template>
                                        已确认
                                    </a-button>
                                </div>
                            </div>
                        </div>
                        <div v-if="r.jobResult.SoundGenerate && r.jobResult.SoundGenerate.records" class="mt-3 flex">
                            <div class="w-32 flex-shrink-0">
                                <div
                                    class="inline-block text-center mr-2 bg-gray-100 w-6 rounded-full px-1 leading-6 h-6"
                                >
                                    4
                                </div>
                                <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                    <i class="iconfont icon-asr"></i>
                                    {{ $t("声音合成") }}
                                </div>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-2 flex-grow">
                                <div
                                    v-for="rr in r.jobResult.SoundGenerate.records.filter((o, i) => {
                                        return i < 5 || !r.runtime?.SoundGenerate.showTruncate;
                                    })"
                                    class="flex mb-1"
                                >
                                    <div class="w-6 flex-shrink-0">
                                        <AudioPlayerButton v-if="rr.audio" :source="rr.audio" />
                                        <icon-refresh v-else spin />
                                    </div>
                                    <div>{{ rr.text }}</div>
                                </div>
                                <div v-if="r.jobResult.SoundGenerate.records.length > 5 && r.runtime">
                                    <a-button
                                        v-if="r.runtime.SoundGenerate.showTruncate"
                                        size="mini"
                                        @click="r.runtime.SoundGenerate.showTruncate = false"
                                    >
                                        <template #icon>
                                            <icon-down />
                                        </template>
                                        {{ $t("展开") }}
                                    </a-button>
                                    <a-button v-else size="mini" @click="r.runtime.SoundGenerate.showTruncate = true">
                                        <template #icon>
                                            <icon-up />
                                        </template>
                                        {{ $t("收起") }}
                                    </a-button>
                                </div>
                            </div>
                        </div>
                        <div v-if="r.jobResult.Combine && r.jobResult.Combine.file" class="mt-3 flex">
                            <div class="w-32 flex-shrink-0">
                                <div
                                    class="inline-block text-center mr-2 bg-gray-100 w-6 rounded-full px-1 leading-6 h-6"
                                >
                                    5
                                </div>
                                <div class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                    <i class="iconfont icon-asr"></i>
                                    {{ $t("视频合成") }}
                                </div>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-2 w-full h-96">
                                <VideoPlayer :url="r.jobResult.Combine.file" />
                            </div>
                        </div>

                        <div class="pt-4 flex items-center">
                            <div class="text-gray-400 flex-grow">
                                <timeago :datetime="r['createdAt'] * 1000" />
                            </div>
                            <div class="">
                                <!-- <a-tooltip v-if="r.result && r._asrRecords" :content="$t('复制文本')" mini>
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
                                </a-tooltip> -->
                                <TaskDownloadAction :record="r" />
                                <TaskDeleteAction
                                    :record="r"
                                    @update="doRefresh"
                                    :file-clean-collector="soundReplaceFileCleanCollector"
                                />
                                <TaskRetryAction :record="r" @update="doRefresh" />
                                <TaskContinueAction :record="r" @update="doRefresh" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <m-empty v-else :text="$t('暂无语音识别任务')" />
        </div>
        <SoundAsrRecordsEditDialog
            ref="soundAsrRecordsEditDialog"
            :save-title="$t('保存并继续')"
            @save="onAsrRecordsUpdate"
        />
    </div>
</template>
