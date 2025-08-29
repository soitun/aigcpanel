<script setup lang="ts">
import {ref} from "vue";
import {TaskRecord, TaskService} from "../../../../service/TaskService";
import SoundReplaceItem from "../components/SoundReplaceItem.vue";
import {Dialog} from "../../../../lib/dialog";
import {t} from "../../../../lang";

const record = ref<TaskRecord | null>(null);
const loading = ref(false);
const currentId = ref<number | null>(null);
const visible = ref(false);

const doLoad = async () => {
    const id = currentId.value;
    if (!id) return;
    loading.value = true;
    try {
        record.value = await TaskService.get(id);
        if (!record.value) {
            Dialog.tipError(t("未找到记录"));
            return;
        }
    } catch (error) {
        Dialog.tipError(t("加载记录失败 {error}", {error}));
    } finally {
        loading.value = false;
    }
};

defineExpose({
    show: (id?: number) => {
        if (id) {
            currentId.value = id;
        }
        visible.value = true;
        doLoad();
    },
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="1200px"
        :footer="false"
        title-align="start"
    >
        <template #title>
            <div class="font-bold">
                {{ $t("声音替换") }}
            </div>
        </template>

        <div v-if="loading" class="flex justify-center items-center p-8">
            <icon-refresh spin class="mr-2"/>
            {{ $t("加载中...") }}
        </div>

        <div v-else-if="record">
            <SoundReplaceItem
                :record="record"
                :on-refresh="doLoad"
            />
        </div>
        <div v-else class="text-center p-8 text-gray-400">
            {{ $t("未找到记录") }}
        </div>
    </a-modal>
</template>
