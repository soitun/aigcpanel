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
import SubtitleTtsCreate from "./components/SubtitleTtsCreate.vue";
import SubtitleTtsItem from "./components/SubtitleTtsItem.vue";
import ListerTop from "../../../components/common/ListerTop.vue";
import MEmpty from "../../../components/common/MEmpty.vue";

const { page, records, recordsForPage } = usePaginate<TaskRecord>({
    pageSize: 10,
});

useTaskChangeRefresh("SubtitleTts", (bizId: string, type: TaskChangeType) => {
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
    const rawRecords = await TaskService.list("SubtitleTts");
    records.value = mergeCheck(rawRecords);
};
</script>

<template>
    <div class="p-5">
        <div class="app-header mb-4 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">
                    {{ $t("task.subtitleToAudio") }}
                </div>
                <div class="text-gray-400 ml-3">
                    {{ $t("app.subtitleTtsDesc") }}
                </div>
            </div>
            <ToggleButton v-model="stepsVisible" />
        </div>
        <Steps
            v-if="stepsVisible"
            :steps="[
                {
                    key: 1,
                    label: $t('app.subtitleParseLabel'),
                    description: $t('app.subtitleParseDesc'),
                },
                {
                    key: 2,
                    label: $t('app.audioSynthesis'),
                    description: $t('app.subtitleAudioDesc'),
                },
            ]"
        />
        <div>
            <SubtitleTtsCreate @submitted="doRefresh" />
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
                    {{ $t("common.selectAll") }}
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
                    <SubtitleTtsItem
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
