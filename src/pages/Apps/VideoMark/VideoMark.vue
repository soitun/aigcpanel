<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import TaskBatchDeleteAction from "../../../components/Server/TaskBatchDeleteAction.vue";
import TaskBatchDownloadAction from "../../../components/Server/TaskBatchDownloadAction.vue";
import ToggleButton from "../../../components/common/ToggleButton.vue";
import { useCheckAll } from "../../../components/common/check-all";
import { usePaginate } from "../../../hooks/paginate";
import { useTaskChangeRefresh } from "../../../hooks/task";
import { TaskRecord, TaskService } from "../../../service/TaskService";
import { TaskChangeType, useTaskStore } from "../../../store/modules/task";
import VideoMarkCreate from "./components/VideoMarkCreate.vue";
import VideoMarkItem from "./components/VideoMarkItem.vue";
import Steps from "../common/Steps.vue";
import ListerTop from "../../../components/common/ListerTop.vue";
import MEmpty from "../../../components/common/MEmpty.vue";

const { page, records, recordsForPage } = usePaginate<TaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh("VideoMark", (bizId: string, type: TaskChangeType) => {
    doRefresh();
});

const { mergeCheck, isIndeterminate, isAllChecked, onCheckAll, checkRecords } =
    useCheckAll({
        records: recordsForPage,
    });

const stepsVisible = ref(false);
const taskStore = useTaskStore();

onMounted(async () => {
    await doRefresh();
});

onUnmounted(() => {});

const doRefresh = async () => {
    const rawRecords = await TaskService.list("VideoMark");
    records.value = mergeCheck(rawRecords);
};
</script>

<template>
    <div class="p-5">
        <div class="app-header mb-4 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">视频标注</div>
                <div class="text-gray-400 ml-3">
                    对视频中的片段进行标注，突出显示重要内容
                </div>
            </div>
            <ToggleButton v-model="stepsVisible" />
        </div>
        <Steps
            v-if="stepsVisible"
            :steps="[
                {
                    key: 1,
                    label: '选择视频',
                    description: '选择需要进行标注处理的视频文件',
                },
                {
                    key: 2,
                    label: '设置标注节点',
                    description: '在时间轴上添加标注节点，设置标注区域和时间',
                },
                {
                    key: 3,
                    label: '生成视频',
                    description: '使用FFmpeg处理视频，生成标注效果',
                },
            ]"
        />
        <div>
            <VideoMarkCreate @submitted="doRefresh" />
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
                    <VideoMarkItem
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
