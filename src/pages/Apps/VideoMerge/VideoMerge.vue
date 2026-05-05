<script setup lang="ts">
import { onMounted, ref } from "vue";
import TaskBatchDeleteAction from "../../../components/Server/TaskBatchDeleteAction.vue";
import TaskBatchDownloadAction from "../../../components/Server/TaskBatchDownloadAction.vue";
import ToggleButton from "../../../components/common/ToggleButton.vue";
import { useCheckAll } from "../../../components/common/check-all";
import { usePaginate } from "../../../hooks/paginate";
import { useTaskChangeRefresh } from "../../../hooks/task";
import { TaskRecord, TaskService } from "../../../service/TaskService";
import { TaskChangeType } from "../../../store/modules/task";
import Steps from "../common/Steps.vue";
import VideoMergeCreate from "./components/VideoMergeCreate.vue";
import VideoMergeItem from "./components/VideoMergeItem.vue";
import ListerTop from "../../../components/common/ListerTop.vue";
import MEmpty from "../../../components/common/MEmpty.vue";

const { page, records, recordsForPage } = usePaginate<TaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh("VideoMerge", (bizId: string, type: TaskChangeType) => {
    doRefresh();
});

const { mergeCheck, isIndeterminate, isAllChecked, onCheckAll, checkRecords } =
    useCheckAll({
        records: recordsForPage,
    });

const stepsVisible = ref(false);

onMounted(async () => {
    await doRefresh();
});

const doRefresh = async () => {
    const rawRecords = await TaskService.list("VideoMerge");
    records.value = mergeCheck(rawRecords);
};
</script>

<template>
    <div class="p-5">
        <div class="app-header mb-4 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">视频合并</div>
                <div class="text-gray-400 ml-3">
                    将多个视频文件合并为一个视频，支持拼接和叠加
                </div>
            </div>
            <ToggleButton v-model="stepsVisible" />
        </div>
        <Steps
            v-if="stepsVisible"
            :steps="[
                {
                    key: 1,
                    label: '选择文件',
                    description: '选择需要合并的视频文件',
                },
                {
                    key: 2,
                    label: '设置合并方式',
                    description: '选择视频合并的方式',
                },
                {
                    key: 3,
                    label: '合并处理',
                    description: '使用FFmpeg将视频合并',
                },
            ]"
        />
        <div>
            <VideoMergeCreate @submitted="doRefresh" />
            <ListerTop
                class="mt-4"
                :total="records.length"
                @refresh="doRefresh"
            >
                <a-checkbox
                    :model-value="isAllChecked"
                    :indeterminate="isIndeterminate"
                    @change="onCheckAll"
                >
                    全选
                </a-checkbox>
                <TaskBatchDeleteAction
                    :records="checkRecords"
                    @update="doRefresh"
                />
                <TaskBatchDownloadAction :records="checkRecords" />
                <template #actions>
                    <a-pagination
                        v-model:current="page"
                        :total="records.length"
                        :page-size="10"
                        show-total
                        simple
                    />
                </template>
            </ListerTop>
            <div v-if="records.length > 0">
                <div v-for="r in recordsForPage" :key="r.id">
                    <VideoMergeItem
                        :record="r"
                        :dialog="false"
                        :on-refresh="doRefresh"
                    />
                </div>
            </div>
            <m-empty v-else />
        </div>
    </div>
</template>
