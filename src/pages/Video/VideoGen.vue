<script setup lang="ts">

import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import VideoGenCreate from "../../components/Video/VideoGenCreate.vue";
import {TaskChangeType, useTaskStore} from "../../store/modules/task";
import TaskBizStatus from "../../components/common/TaskBizStatus.vue";
import VideoPlayer from "../../components/common/VideoPlayer.vue";
import ServerTaskResultParam from "../../components/Server/ServerTaskResultParam.vue";
import AudioPlayer from "../../components/common/AudioPlayer.vue";
import {TaskRecord, TaskService} from "../../service/TaskService";
import TaskCancelAction from "../../components/Server/TaskCancelAction.vue";
import {useCheckAll} from "../../components/common/check-all";
import TaskBatchDeleteAction from "../../components/Server/TaskBatchDeleteAction.vue";
import TaskTitleField from "../../components/Server/TaskTitleField.vue";
import TaskBatchDownloadAction from "../../components/Server/TaskBatchDownloadAction.vue";
import TaskDownloadAction from "../../components/Server/TaskDownloadAction.vue";
import TaskDeleteAction from "../../components/Server/TaskDeleteAction.vue";
import TaskDuration from "../../components/Server/TaskDuration.vue";

const videoGenCreate = ref<InstanceType<typeof VideoGenCreate> | null>(null)

const records = ref<TaskRecord[]>([])
const taskStore = useTaskStore()

const page = ref(1)
const recordsForPage = computed(() => {
    return records.value.slice((page.value - 1) * 10, page.value * 10)
})

const {
    mergeCheck,
    isIndeterminate,
    isAllChecked,
    onCheckAll,
    checkRecords
} = useCheckAll({
    records: recordsForPage
})

const doRefresh = async () => {
    records.value = mergeCheck(await TaskService.list('VideoGen'))
}

const taskChangeCallback = (bizId: string, type: TaskChangeType) => {
    setTimeout(doRefresh, 1000)
}

onMounted(async () => {
    await doRefresh()
    taskStore.onChange('VideoGen', taskChangeCallback)
})
onBeforeUnmount(() => {
    taskStore.offChange('VideoGen', taskChangeCallback)
})

</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t('视频合成') }}
            </div>
            <div class="flex items-center">
                <a-tooltip v-if="0"
                           :content="$t('清空历史')" position="right" mini>
                    <a-button class="ml-1">
                        <template #icon>
                            <icon-delete/>
                        </template>
                    </a-button>
                </a-tooltip>
            </div>
        </div>
        <div>
            <VideoGenCreate ref="videoGenCreate" @submitted="doRefresh"/>
            <div>
                <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg flex items-center">
                    <div class="flex-grow flex items-center">
                        <div class="mr-3">
                            <a-checkbox :model-value="isAllChecked" :indeterminate="isIndeterminate"
                                        @change="onCheckAll">
                                {{ $t('全选') }}
                            </a-checkbox>
                        </div>
                        <TaskBatchDeleteAction :records="checkRecords" @update="doRefresh"/>
                        <TaskBatchDownloadAction :records="checkRecords"/>
                    </div>
                    <div>
                        <a-pagination v-model:current="page" :total="records.length" :page-size="10" show-total simple/>
                    </div>
                </div>
                <div v-for="r in recordsForPage" :key="r.id">
                    <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                        <div class="flex items-center">
                            <div class="inline-flex items-start bg-blue-100 rounded-full px-2 leading-8 h-8 mr-2">
                                <div class="mr-2 h-8 pt-0.5">
                                    <a-checkbox v-model="r['_check']"/>
                                </div>
                                <div class="">
                                    <TaskTitleField :record="r" @title-click="r['_check']=!r['_check']" @update="v=>r.title=v"/>
                                </div>
                            </div>
                            <div class="flex-grow"></div>
                            <div class="ml-1">
                                <TaskDuration :start="r.startTime" :end="r.endTime"/>
                            </div>
                            <div class="ml-1">
                                <TaskBizStatus :status="r.status" :status-msg="r.statusMsg"/>
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6">
                                <i class="iconfont icon-server mr-1"></i>
                                {{ r.serverTitle }}
                                v{{ r.serverVersion }}
                            </div>
                            <ServerTaskResultParam :record="r as any"/>
                        </div>
                        <div class="pt-4 flex">
                            <div class="flex-grow">
                                <div class="flex mb-3">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-2 leading-6 rounded-lg">
                                            <i class="iconfont icon-video-template"></i>
                                            {{ $t('视频形象') }}
                                        </div>
                                    </div>
                                    <div class="">
                                        {{ r.modelConfig.videoTemplateName }}
                                    </div>
                                </div>
                                <div v-if="r.modelConfig.soundType==='soundTts'" class="flex">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-2 leading-6 rounded-lg">
                                            <i class="iconfont icon-sound"></i>
                                            {{ $t('声音合成') }}
                                        </div>
                                    </div>
                                    <div class="">
                                        {{ r.modelConfig.soundTtsText }}
                                    </div>
                                </div>
                                <div v-if="r.modelConfig.soundType==='soundClone'" class="flex items-center">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-2 leading-6 rounded-lg">
                                            <i class="iconfont icon-video-template"></i>
                                            {{ $t('声音克隆') }}
                                        </div>
                                    </div>
                                    <div>
                                        {{ r.modelConfig.soundCloneText }}
                                    </div>
                                </div>
                                <div v-if="r.modelConfig.soundType==='soundCustom'" class="flex items-start">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-2 leading-6 rounded-lg">
                                            <icon-file/>
                                            {{ $t('本地文件') }}
                                        </div>
                                    </div>
                                    <div class="flex-grow">
                                        <AudioPlayer :url="`file://${r.modelConfig.soundCustomFile}`"/>
                                    </div>
                                </div>
                            </div>
                            <div class="flex-shrink-0 ml-8">
                                <div class="p-2 rounded shadow bg-gray-300" v-if="r.result.url">
                                    <div class="w-48 h-48">
                                        <VideoPlayer :url="'file://'+r.result.url"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="pt-4 flex items-center">
                            <div class="flex-grow">
                                <TaskDownloadAction :record="r"/>
                                <TaskDeleteAction :record="r" @update="doRefresh"/>
                                <TaskCancelAction :record="r"/>
                            </div>
                            <div class="text-gray-400">
                                <timeago :datetime="r['createdAt']*1000"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
