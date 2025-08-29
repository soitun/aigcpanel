<script setup lang="ts">
import {computed, ref} from "vue";
import ServerNameVersion from "../../../../components/Server/ServerNameVersion.vue";
import TaskContinueAction from "../../../../components/Server/TaskContinueAction.vue";
import TaskDeleteAction from "../../../../components/Server/TaskDeleteAction.vue";
import TaskDownloadAction from "../../../../components/Server/TaskDownloadAction.vue";
import TaskDuration from "../../../../components/Server/TaskDuration.vue";
import TaskTitleField from "../../../../components/Server/TaskTitleField.vue";
import TextTruncateView from "../../../../components/TextTruncateView.vue";
import AudioPlayer from "../../../../components/common/AudioPlayer.vue";
import AudioPlayerButton from "../../../../components/common/AudioPlayerButton.vue";
import TaskBizStatus from "../../../../components/common/TaskBizStatus.vue";
import VideoPlayer from "../../../../components/common/VideoPlayer.vue";
import {ToggleUtil} from "../../../../lib/toggle";
import {TaskRecord, TaskService} from "../../../../service/TaskService";
import SoundAsrRecordsEditDialog from "../../../Sound/components/SoundAsrRecordsEditDialog.vue";
import SoundGenerateFormViewBody from "../../../Sound/components/SoundGenerateFormViewBody.vue";
import SoundReplaceItemDialog from "./SoundReplaceItemDialog.vue";
import {soundReplaceFileCleanCollector} from "../util";
import {useTaskStore} from "../../../../store/modules/task";

interface Props {
    record: TaskRecord;
    onRefresh: () => void;
}

const taskStore = useTaskStore()
const props = defineProps<Props>();

const soundAsrRecordsEditDialog = ref<InstanceType<typeof SoundAsrRecordsEditDialog> | null>(null);
const soundReplaceItemDialog = ref<InstanceType<typeof SoundReplaceItemDialog> | null>(null);
const dialogVisible = ref(false);

const soundAsrText = computed(() => {
    if (props.record.jobResult.SoundAsr && props.record.jobResult.SoundAsr.records) {
        return props.record.jobResult.SoundAsr.records.map(item => item.text).join(" ");
    }
    return "";
});

const confirmText = computed(() => {
    if (props.record.jobResult.Confirm && props.record.jobResult.Confirm.records) {
        return props.record.jobResult.Confirm.records.map(item => item.text).join(" ");
    }
    return "";
});

const recordId = computed(() => props.record.id as any);

const onViewDetail = () => {
    soundReplaceItemDialog.value?.show(props.record.id!);
    dialogVisible.value = true;
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
    props.onRefresh();
};
</script>

<template>
    <div class="rounded-xl shadow border p-4 mb-4 hover:shadow-lg">
        <div class="flex items-center">
            <div class="inline-flex items-start bg-blue-100 rounded-full px-2 leading-8 h-8 mr-2">
                <div class="mr-2 h-8 pt-0.5">
                    <a-checkbox v-model="record['_check']"/>
                </div>
                <div class="">
                    <TaskTitleField
                        :record="record"
                        @title-click="record['_check'] = !record['_check']"
                        @update="v => (record.title = v)"
                    />
                </div>
            </div>
            <div class="flex-grow"></div>
            <div class="ml-1">
                <TaskDuration :start="record.startTime" :end="record.endTime"/>
            </div>
            <div class="ml-1">
                <TaskBizStatus :status="record.status" :status-msg="record.statusMsg"/>
            </div>
        </div>
        <div class="mt-3 flex">
            <div class="w-24 flex-shrink-0">
                <div class="inline-block text-center">
                    <i class="iconfont icon-sound-prompt"></i>
                    {{ $t("提取音频") }}
                </div>
            </div>
            <div class="flex-grow pt-1">
                <div v-if="record.jobResult.ToAudio && record.jobResult.ToAudio.file">
                    <AudioPlayer :url="record.jobResult.ToAudio.file" show-wave/>
                </div>
                <div
                    v-else-if="record.jobResult.step === 'ToAudio' && record.status === 'running'"
                    class="bg-gray-100 rounded-lg p-1"
                >
                    <div class="text-gray-400 text-xs">
                        <icon-refresh spin/>
                        {{ $t("处理中") }}
                    </div>
                </div>
                <div v-else class="bg-gray-100 rounded-lg p-1">
                    <div class="text-gray-400 text-xs">
                        <icon-info-circle/>
                        {{ $t("未处理") }}
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3 flex">
            <div class="w-24 flex-shrink-0">
                <div class="inline-block text-center">
                    <i class="iconfont icon-asr"></i>
                    {{ $t("语音识别") }}
                </div>
            </div>
            <div class="flex-grow pt-1">
                <div v-if="record.jobResult.SoundAsr && record.jobResult.SoundAsr.records">
                    <div class="bg-gray-100 rounded-lg p-2">
                        <TextTruncateView :max-length="40" :text="soundAsrText"/>
                    </div>
                </div>
                <div
                    v-else-if="record.jobResult.step === 'SoundAsr' && record.status === 'running'"
                    class="bg-gray-100 rounded-lg p-1"
                >
                    <div class="text-gray-400 text-xs">
                        <icon-refresh spin/>
                        {{ $t("处理中") }}
                    </div>
                </div>
                <div v-else class="bg-gray-100 rounded-lg p-1">
                    <div class="text-gray-400 text-xs">
                        <icon-info-circle/>
                        {{ $t("未处理") }}
                    </div>
                </div>
                <div class="mt-1">
                    <ServerNameVersion :record="record.modelConfig.soundAsr"/>
                </div>
            </div>
        </div>
        <div class="mt-3 flex">
            <div class="w-24 flex-shrink-0">
                <div class="inline-block text-center">
                    <i class="iconfont icon-video-text"></i>
                    {{ $t("重排确认") }}
                </div>
            </div>
            <div class="flex-grow pt-1">
                <div v-if="record.jobResult.Confirm && record.jobResult.Confirm.records">
                    <div class="mb-1">
                        <div class="bg-gray-100 rounded-lg p-2">
                            <TextTruncateView :max-length="40" :text="confirmText"/>
                        </div>
                    </div>
                    <div v-if="!record.jobResult.Confirm.confirm">
                        <a-button
                            type="primary"
                            @click="
                                soundAsrRecordsEditDialog?.edit(
                                    recordId,
                                    record.jobResult.Confirm.records
                                )
                            "
                        >
                            <template #icon>
                                <icon-check-circle/>
                            </template>
                            {{ $t("修改确认文字") }}
                        </a-button>
                    </div>
                </div>
                <div v-else class="bg-gray-100 rounded-lg p-1">
                    <div class="text-gray-400 text-xs">
                        <icon-info-circle/>
                        {{ $t("未处理") }}
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3 flex">
            <div class="w-24 flex-shrink-0">
                <div class="inline-block text-center">
                    <i class="iconfont icon-sound"></i>
                    {{ $t("声音合成") }}
                </div>
            </div>
            <div class="flex-grow">
                <div
                    v-if="record.jobResult.SoundGenerate && record.jobResult.SoundGenerate.records"
                    class="bg-gray-100 rounded-lg"
                >
                    <div class="max-h-96 overflow-y-auto p-2 rounded-lg">
                        <div
                            v-for="(rr, index) in record.jobResult.SoundGenerate.records.filter((o, i) => {
                                return i < 2 || ToggleUtil.get('SoundReplace', record.id, false).value;
                            })"
                            :key="index"
                            class="flex mb-1"
                        >
                            <div class="w-6 flex-shrink-0">
                                <AudioPlayerButton v-if="rr.audio" :source="rr.audio"/>
                                <icon-refresh
                                    v-else-if="
                                        record.jobResult.step === 'SoundGenerate' && record.status === 'running'
                                    "
                                    spin
                                />
                                <icon-info-circle v-else class="text-gray-400 text-xs"/>
                            </div>
                            <div>{{ rr.text }}</div>
                        </div>
                    </div>
                    <div v-if="record.jobResult.SoundGenerate.records.length > 5" class="p-2">
                        <a-button
                            v-if="!ToggleUtil.get('SoundReplace', record.id, false).value"
                            size="mini"
                            @click="ToggleUtil.toggle('SoundReplace', record.id)"
                        >
                            <template #icon>
                                <icon-down/>
                            </template>
                            {{ $t("展开") }}
                        </a-button>
                        <a-button v-else size="mini" @click="ToggleUtil.toggle('SoundReplace', record.id)">
                            <template #icon>
                                <icon-up/>
                            </template>
                            {{ $t("收起") }}
                        </a-button>
                    </div>
                </div>
                <div v-else class="bg-gray-100 rounded-lg p-1">
                    <div class="text-gray-400 text-xs">
                        <icon-info-circle/>
                        {{ $t("未处理") }}
                    </div>
                </div>
                <div class="mt-1 flex gap-1">
                    <SoundGenerateFormViewBody :data="record.modelConfig.soundGenerate"/>
                </div>
            </div>
        </div>
        <div class="mt-3 flex">
            <div class="w-24 flex-shrink-0">
                <div class="inline-block text-center">
                    <i class="iconfont icon-video"></i>
                    {{ $t("视频合成") }}
                </div>
            </div>
            <div
                v-if="record.jobResult.Combine && record.jobResult.Combine.file"
                class="bg-gray-100 rounded-lg p-2 w-full h-96"
            >
                <VideoPlayer :url="record.jobResult.Combine.file"/>
            </div>
            <div
                v-else-if="record.jobResult.step === 'Combine' && record.status === 'running'"
                class="bg-gray-100 rounded-lg p-1"
            >
                <div class="text-gray-400 text-xs">
                    <icon-refresh spin/>
                    {{ $t("处理中") }}
                </div>
            </div>
            <div v-else class="bg-gray-100 rounded-lg p-1 flex-grow">
                <div class="text-gray-400 text-xs">
                    <icon-info-circle/>
                    {{ $t("未处理") }}
                </div>
            </div>
        </div>

        <div class="pt-4 flex items-center">
            <div class="text-gray-400 text-xs mr-2">
                #{{ record.id }}
            </div>
            <div class="text-gray-400 flex-grow">
                <timeago :datetime="record['createdAt'] * 1000"/>
            </div>
            <div class="">
                <a-button
                    v-if="record.id"
                    @click="onViewDetail"
                    class="mr-2"
                >
                    <template #icon>
                        <icon-eye/>
                    </template>
                    {{ $t("查看详情") }}
                </a-button>
                <TaskDownloadAction :record="record"/>
                <TaskDeleteAction
                    :record="record"
                    @update="onRefresh"
                    :file-clean-collector="soundReplaceFileCleanCollector"
                />
                <TaskContinueAction :record="record" @update="onRefresh"/>
            </div>
        </div>
    </div>
    <SoundAsrRecordsEditDialog
        ref="soundAsrRecordsEditDialog"
        :save-title="$t('保存并继续')"
        @save="onAsrRecordsUpdate"
    />
    <SoundReplaceItemDialog
        ref="soundReplaceItemDialog"
        :id="recordId"
        v-model:visible="dialogVisible"
    />
</template>
