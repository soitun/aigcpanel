<script setup lang="ts">

import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import VideoGenFlowCreate from "../../components/Video/VideoGenFlowCreate.vue";
import {TaskChangeType, useTaskStore} from "../../store/modules/task";
import VideoGenActionDownload from "../../components/Video/VideoGenActionDownload.vue";
import TaskBizStatus from "../../components/common/TaskBizStatus.vue";
import VideoPlayer from "../../components/common/VideoPlayer.vue";
import VideoDuration from "../../components/Video/VideoDuration.vue";
import ServerTaskResultParam from "../../components/Server/ServerTaskResultParam.vue";
import AudioPlayer from "../../components/common/AudioPlayer.vue";
import {TaskRecord, TaskService} from "../../service/TaskService";
import TaskCancelAction from "../../components/Server/TaskCancelAction.vue";
import TaskDeleteAction from "../../components/Server/TaskDeleteAction.vue";

const videoGenFlowCreate = ref<InstanceType<typeof VideoGenFlowCreate> | null>(null)

const records = ref<TaskRecord[]>([])
const taskStore = useTaskStore()

const page = ref(1)
const recordsForPage = computed(() => {
    return records.value.slice((page.value - 1) * 10, page.value * 10)
})

const doRefresh = async () => {
    records.value = await TaskService.list('VideoGenFlow')
}

const taskChangeCallback = (bizId: string, type: TaskChangeType) => {
    setTimeout(doRefresh, 1000)
}

onMounted(async () => {
    await doRefresh()
    taskStore.onChange('VideoGenFlow', taskChangeCallback)
})
onBeforeUnmount(() => {
    taskStore.offChange('VideoGenFlow', taskChangeCallback)
})

</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t('一键合成') }}
            </div>
            <div class="flex items-center">
                <a-tooltip v-if="0"
                           :content="$t('清空历史')" position="right">
                    <a-button class="ml-1">
                        <template #icon>
                            <icon-delete/>
                        </template>
                    </a-button>
                </a-tooltip>
            </div>
        </div>
        <div>
            <VideoGenFlowCreate ref="videoGenFlowCreate" @submitted="doRefresh"/>
            <div>
                <div v-if="records.length>10" class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                    <a-pagination v-model:current="page" :total="records.length" :page-size="10" show-total/>
                </div>
                <div v-for="r in recordsForPage" :key="r.id">
                    <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                        <div class="flex items-center">
                            <div class="flex-grow flex items-center">
                                <div class="inline-block mr-2 bg-blue-100 rounded-lg px-2 leading-8 h-8">
                                    #{{ r.id }}
                                </div>
                                <div class="inline-block mr-2 bg-blue-100 rounded-lg px-2 leading-8 h-8">
                                    <i class="iconfont icon-server mr-1"></i>
                                    {{ r.serverTitle }}
                                    v{{ r.serverVersion }}
                                </div>
                                <ServerTaskResultParam :record="r as any"/>
                            </div>
                            <div class="ml-1">
                                <VideoDuration :start="r.startTime" :end="r.endTime"/>
                            </div>
                            <div class="ml-1">
                                <TaskBizStatus :status="r.status" :status-msg="r.statusMsg"/>
                            </div>
                        </div>
                        <div class="pt-4 flex">
                            <div class="flex-grow">
                                <div class="flex mb-3">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-3 py-1 leading-6 rounded">
                                            <i class="iconfont icon-video-template"></i>
                                            {{ $t('视频形象') }}
                                        </div>
                                    </div>
                                    <div class="pt-1">
                                        {{ r.modelConfig.videoTemplateName }}
                                    </div>
                                </div>
                                <div v-if="r.modelConfig.soundType==='soundTts'" class="flex">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-3 py-1 leading-6 rounded">
                                            <i class="iconfont icon-sound"></i>
                                            {{ $t('声音合成') }}
                                        </div>
                                    </div>
                                    <div class="pt-1">
                                        {{ r.modelConfig.text }}
                                    </div>
                                </div>
                                <div v-if="r.modelConfig.soundType==='soundClone'" class="flex items-center">
                                    <div class="mr-2 flex-shrink-0">
                                        <div class="bg-gray-100 px-3 py-1 leading-6 rounded">
                                            <i class="iconfont icon-video-template"></i>
                                            {{ $t('声音克隆') }}
                                        </div>
                                    </div>
                                    <div>
                                        {{ r.modelConfig.text }}
                                    </div>
                                </div>
                                <div class="mt-3" v-if="r.status==='success' && r.result.urlSound">
                                    <AudioPlayer
                                        show-wave
                                        :url="'file://'+r.result.urlSound"/>
                                </div>
                            </div>
                            <div class="flex-shrink-0 ml-8">
                                <div class="p-2 rounded shadow bg-gray-300" v-if="r.status==='success' && r.result.url">
                                    <div class="w-48 h-48" v-if="r.result.url">
                                        <VideoPlayer :url="'file://'+r.result.url"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="pt-4 flex items-center">
                            <div class="flex-grow">
                                <VideoGenActionDownload :record="r"/>
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
