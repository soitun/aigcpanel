<script setup lang="ts">

import AudioPlayer from "../../components/common/AudioPlayer.vue";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {TaskChangeType, useTaskStore} from "../../store/modules/task";
import SoundCloneCreate from "../../components/Sound/SoundCloneCreate.vue";
import SoundCloneActionDownload from "../../components/Sound/SoundCloneActionDownload.vue";
import SoundCloneActionDelete from "../../components/Sound/SoundCloneActionDelete.vue";
import TaskBizStatus from "../../components/common/TaskBizStatus.vue";
import SoundDuration from "../../components/Sound/SoundDuration.vue";
import ServerTaskResultParam from "../../components/Server/ServerTaskResultParam.vue";
import {TaskRecord, TaskService} from "../../service/TaskService";
import TaskCancelAction from "../../components/Server/TaskCancelAction.vue";
import {useCheckAll} from "../../components/common/check-all";
import TaskBatchDeleteAction from "../../components/Server/TaskBatchDeleteAction.vue";
import TaskTitleField from "../../components/Server/TaskTitleField.vue";

const records = ref<TaskRecord[]>([])
const taskStore = useTaskStore()

const page = ref(1)
const recordsForPage = computed(() => {
    return records.value.slice((page.value - 1) * 10, page.value * 10)
})

const taskChangeCallback = (bizId: string, type: TaskChangeType) => {
    doRefresh()
}

onMounted(async () => {
    await doRefresh()
    taskStore.onChange('SoundClone', taskChangeCallback)
})
onBeforeUnmount(() => {
    taskStore.offChange('SoundClone', taskChangeCallback)
})

const {
    mergeCheck,
    isIndeterminate,
    isAllChecked,
    onCheckAll,
    checkRecords
} = useCheckAll({
    records
})

const doRefresh = async () => {
    records.value = mergeCheck(await TaskService.list('SoundClone'))
}

</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t('声音克隆') }}
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
            <SoundCloneCreate @submitted="doRefresh"/>
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
                        <a-button v-if="0" :disabled="!checkRecords.length" class="mr-2">
                            <template #icon>
                                <icon-download/>
                            </template>
                        </a-button>
                    </div>
                    <div>
                        <a-pagination v-model:current="page" :total="records.length" :page-size="10" show-total simple/>
                    </div>
                </div>
                <div v-for="r in recordsForPage" :key="r.id">
                    <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg">
                        <div class="flex items-center">
                            <div class="inline-flex items-start bg-blue-100 rounded-lg px-2 leading-8 h-8 mr-2">
                                <div class="mr-2 h-8">
                                    <a-checkbox v-model="r['_check']"/>
                                </div>
                                <div class="">
                                    <TaskTitleField :record="r" @update="v=>r.title=v" />
                                </div>
                            </div>
                            <div class="flex-grow"></div>
                            <div class="ml-1">
                                <SoundDuration :start="r.startTime" :end="r.endTime"/>
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
                            <div class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6">
                                <i class="iconfont icon-sound-prompt mr-1"></i>
                                {{ r.modelConfig.promptName }}
                            </div>
                            <div v-if="r.param.speed"
                                 class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6">
                                <i class="iconfont icon-speed mr-1"></i>
                                <span class="">x{{ r.param.speed }}</span>
                            </div>
                            <div v-if="r.param.crossLingual"
                                 class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6">
                                <i class="iconfont icon-global mr-1"></i>
                                <span class="">{{ $t('跨语种') }}</span>
                            </div>
                            <ServerTaskResultParam :record="r as any"/>
                        </div>
                        <div class="pt-4">
                            {{ r.modelConfig.text }}
                        </div>
                        <div class="pt-4" v-if="r.result.url">
                            <AudioPlayer
                                show-wave
                                :url="'file://'+r.result.url"/>
                        </div>
                        <div class="pt-4 flex items-center">
                            <div class="flex-grow">
                                <SoundCloneActionDownload :record="r"/>
                                <SoundCloneActionDelete :record="r" @update="doRefresh"/>
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

<style scoped>

</style>
