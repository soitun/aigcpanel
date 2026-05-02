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
import LongTextTtsCreate from "./components/LongTextTtsCreate.vue";
import LongTextTtsItem from "./components/LongTextTtsItem.vue";

const { page, records, recordsForPage } = usePaginate<TaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh("LongTextTts", (bizId: string, type: TaskChangeType) => {
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
    const rawRecords = await TaskService.list("LongTextTts");
    records.value = mergeCheck(rawRecords);
};
</script>

<template>
    <div class="p-5">
        <div class="app-header mb-4 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">
                    {{ $t("app.longTextTts") }}
                </div>
                <div class="text-gray-400 ml-3">
                    {{ $t("app.longTextTtsDesc") }}
                </div>
            </div>
            <ToggleButton v-model="stepsVisible" />
        </div>
        <Steps
            v-if="stepsVisible"
            :steps="[
                {
                    key: 1,
                    label: $t('app.splitText'),
                    description: $t('app.longTextTtsSplitDesc'),
                },
                {
                    key: 2,
                    label: $t('app.audioSynthesis'),
                    description: $t('app.longTextTtsAudioDesc'),
                },
                {
                    key: 3,
                    label: $t('app.mergeAudio'),
                    description: $t('app.longTextTtsMergeDesc'),
                },
            ]"
        />
        <div>
            <LongTextTtsCreate @submitted="doRefresh" />
            <div v-if="records.length > 0">
                <div
                    class="rounded-xl shadow border p-4 mt-4 mb-4 hover:shadow-lg flex items-center"
                >
                    <div class="flex-grow flex items-center">
                        <div class="mr-3">
                            <a-checkbox
                                :model-value="isAllChecked"
                                :indeterminate="isIndeterminate"
                                @change="onCheckAll"
                            >
                                {{ $t("common.selectAll") }}
                            </a-checkbox>
                        </div>
                        <TaskBatchDeleteAction
                            :records="checkRecords"
                            @update="doRefresh"
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
                    <LongTextTtsItem
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
