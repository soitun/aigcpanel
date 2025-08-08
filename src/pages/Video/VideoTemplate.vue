<script setup lang="ts">
import {onMounted, ref} from "vue";
import {t} from "../../lang";
import {Dialog} from "../../lib/dialog";
import {VideoTemplateRecord, VideoTemplateService} from "../../service/VideoTemplateService";
import VideoPlayer from "../../components/common/VideoPlayer.vue";
import InputInlineEditor from "../../components/common/InputInlineEditor.vue";
import VideoTemplateEditDialog from "./components/VideoTemplateEditDialog.vue";

const editDialog = ref<InstanceType<typeof VideoTemplateEditDialog>>();
const records = ref<VideoTemplateRecord[]>([]);
const loading = ref(true);

const doRefresh = async () => {
    loading.value = true;
    records.value = await VideoTemplateService.list();
    loading.value = false;
};

onMounted(async () => {
    await doRefresh();
});

const doDelete = async (record: VideoTemplateRecord) => {
    await Dialog.confirm(t("确认删除？"));
    await VideoTemplateService.delete(record);
    await doRefresh();
};

const onChangeTitle = async (record: VideoTemplateRecord, value: string) => {
    record.name = value;
    await VideoTemplateService.update(record);
    await doRefresh();
};

const onUpdate = async () => {
    await doRefresh();
};
</script>

<template>
    <div class="p-5">
        <div class="mb-4 flex items-center">
            <div class="flex-grow flex items-end">
                <div class="text-3xl font-bold">{{ $t("数字人形象") }}</div>
                <div class="text-gray-400 ml-3">{{ $t("管理多个数字人形象") }}</div>
            </div>
            <div class="flex items-center">
                <a-button @click="editDialog?.add()">
                    <template #icon>
                        <icon-plus />
                    </template>
                    {{ $t("添加") }}
                </a-button>
            </div>
        </div>
        <div>
            <m-empty v-if="!records.length && !loading" />
            <m-loading v-else-if="!records.length && loading" page />
            <div class="flex flex-wrap -mx-2">
                <div v-for="r in records" :key="r.id" class="w-1/3 flex-shrink-0 p-2">
                    <div class="rounded-xl shadow border p-4 hover:shadow-lg">
                        <div class="flex mb-3">
                            <div class="flex-grow w-0 mr-2">
                                <div
                                    class="inline-flex max-w-full items-center bg-blue-100 rounded-full px-2 leading-8 h-8"
                                >
                                    <div class="truncate overflow-hidden flex-grow cursor-pointer">
                                        {{ r.name }}
                                    </div>
                                    <InputInlineEditor :value="r.name" @change="onChangeTitle(r, $event)">
                                        <a class="ml-1 text-gray-400" href="javascript:;">
                                            <icon-pen />
                                        </a>
                                    </InputInlineEditor>
                                </div>
                            </div>
                            <div>
                                <a-button @click="doDelete(r)">
                                    <template #icon>
                                        <icon-delete />
                                    </template>
                                </a-button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="h-48 bg-black p-2 rounded-lg">
                                <VideoPlayer :url="'file://' + r.video" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <VideoTemplateEditDialog @update="onUpdate" ref="editDialog" />
</template>
