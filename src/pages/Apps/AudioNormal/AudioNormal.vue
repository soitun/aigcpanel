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
import AudioNormalCreate from "./components/AudioNormalCreate.vue";
import AudioNormalItem from "./components/AudioNormalItem.vue";
import ListerTop from "../../../components/common/ListerTop.vue";
import MEmpty from "../../../components/common/MEmpty.vue";

const { page, records, recordsForPage } = usePaginate<TaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh("AudioNormal", (bizId: string, type: TaskChangeType) => {
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
    const rawRecords = await TaskService.list("AudioNormal");
    records.value = mergeCheck(rawRecords);
};
</script>

<template>
    <div class="p-5">
        <div class="app-header mb-2 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">{{ "声音归一化" }}</div>
                <div class="text-gray-400 ml-3">
                    {{ "对视频或音频进行声音归一化处理，调整音量使声音更均衡" }}
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
                    description: '选择需要处理的视频或音频文件',
                },
                {
                    key: 2,
                    label: '设置归一化程度',
                    description: '调整归一化的强度百分比',
                },
                {
                    key: 3,
                    label: '处理文件',
                    description: '使用FFmpeg进行音频归一化处理',
                },
            ]"
        />
        <div>
            <AudioNormalCreate @submitted="doRefresh" />
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
                    {{ "全选" }}
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
                    <AudioNormalItem
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
