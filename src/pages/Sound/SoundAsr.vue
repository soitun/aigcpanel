<script setup lang="ts">

import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ServerTaskResultParam from "../../components/Server/ServerTaskResultParam.vue";
import TaskBatchDeleteAction from "../../components/Server/TaskBatchDeleteAction.vue";
import TaskBatchDownloadAction from "../../components/Server/TaskBatchDownloadAction.vue";
import TaskCancelAction from "../../components/Server/TaskCancelAction.vue";
import TaskDeleteAction from "../../components/Server/TaskDeleteAction.vue";
import TaskDownloadAction from "../../components/Server/TaskDownloadAction.vue";
import TaskTitleField from "../../components/Server/TaskTitleField.vue";
import { useCheckAll } from "../../components/common/check-all";
import { doCopy } from "../../components/common/util";
import { TaskRecord, TaskService } from "../../service/TaskService";
import { TaskChangeType, useTaskStore } from "../../store/modules/task";
import SoundAsrCreate from "./Components/SoundAsrCreate.vue";

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
    taskStore.onChange('SoundAsr', taskChangeCallback)
})

onBeforeUnmount(() => {
    taskStore.offChange('SoundAsr', taskChangeCallback)
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
    records.value = mergeCheck(await TaskService.list('SoundAsr'))
}

const onCreateSubmitted = () => {
    doRefresh()
}

</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="text-3xl font-bold flex-grow">
                {{ $t('语音识别') }}
            </div>
        </div>
        <div>
            <SoundAsrCreate @submitted="onCreateSubmitted" />
            <div>
                <div class="rounded-xl shadow border p-4 mt-4 hover:shadow-lg flex items-center">
                    <div class="flex-grow flex items-center">
                        <div class="mr-3">
                            <a-checkbox :model-value="isAllChecked" :indeterminate="isIndeterminate"
                                @change="onCheckAll">
                                {{ $t('全选') }}
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
                                        @update="v => r.title = v" />
                                </div>
                            </div>
                            <div class="ml-auto text-sm text-gray-600">
                                <timeago :datetime="r['createdAt'] * 1000" />
                            </div>
                        </div>
                        <div class="mt-2 ml-2">
                            <div class="text-sm text-gray-600 mb-2">
                                <span class="inline-block mr-2 bg-gray-100 rounded-lg px-1 leading-6 h-6">
                                    <i class="iconfont icon-server mr-1"></i>
                                    {{ r.serverTitle }}
                                    v{{ r.serverVersion }}
                                </span>
                                <span v-if="r.modelConfig?.model"
                                    class="inline-block mr-2 bg-gray-100 rounded-lg px-2 leading-6 h-6">
                                    <i class="iconfont icon-model mr-1"></i>
                                    {{ r.modelConfig.model }}
                                </span>
                            </div>
                            <ServerTaskResultParam :record="r as any" />
                            <div v-if="r.result && r.result.text" class="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div class="text-sm font-medium text-gray-700 mb-2">识别结果：</div>
                                <div class="text-sm cursor-pointer" @click="doCopy(r.result.text)">{{ r.result.text }}
                                </div>
                            </div>
                            <div class="pt-4 flex items-center">
                                <div class="text-gray-400 flex-grow">
                                    <timeago :datetime="r['createdAt'] * 1000" />
                                </div>
                                <div class="">
                                    <TaskDownloadAction :record="r" />
                                    <TaskDeleteAction :record="r" @update="doRefresh" />
                                    <TaskCancelAction :record="r" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="recordsForPage.length === 0" class="text-center py-8 text-gray-500">
                    <i class="iconfont icon-empty text-4xl mb-2"></i>
                    <div>暂无语音识别任务</div>
                </div>
            </div>
        </div>
    </div>
</template>
