<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import FileSelector from "../../../../components/common/FileSelector.vue";
import { dataAutoSaveDraft } from "../../../../components/common/util";
import { t } from "../../../../lang";
import { Dialog } from "../../../../lib/dialog";
import { TaskRecord, TaskService } from "../../../../service/TaskService";
import VideoMergeImageParamForm from "./VideoMergeImageParamForm.vue";

const emit = defineEmits<{
    submitted: [];
}>();

const paramForm = ref<InstanceType<typeof VideoMergeImageParamForm> | null>(
    null,
);

const formData = ref({
    video: "",
    image: "",
});

const { clearDraft } = dataAutoSaveDraft(
    "VideoMergeImageCreate.formData",
    formData.value,
);

const doSubmit = async () => {
    const videoMergeImageValue = await paramForm.value?.getValue();
    if (!videoMergeImageValue) {
        return;
    }
    if (!formData.value.video) {
        Dialog.tipError("请选择视频文件");
        return;
    }
    if (!formData.value.image) {
        Dialog.tipError("请选择图片");
        return;
    }

    const taskTitle = $mapi.file.pathToName(formData.value.video, false);
    const record: TaskRecord = {
        biz: "VideoMergeImage",
        title: taskTitle,
        serverName: "",
        serverTitle: "",
        serverVersion: "",
        modelConfig: {
            video: formData.value.video,
            image: formData.value.image,
            ...videoMergeImageValue,
        },
        param: {},
    };
    const id = await TaskService.submit(record);
    formData.value.video = "";
    formData.value.image = "";
    emit("submitted");
    Dialog.tipSuccess(t("common.taskSubmitted"));
    clearDraft();
    return id;
};
</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <div class="mb-4 flex items-start">
            <div class="pt-1 w-5">
                <a-tooltip :content="'视频文件'" mini>
                    <icon-video-camera />
                </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <FileSelector :extensions="['mp4']" v-model="formData.video" />
            </div>
        </div>
        <div class="mb-4 flex items-start">
            <div class="pt-1 w-5">
                <a-tooltip :content="'图片文件'" mini>
                    <icon-image />
                </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <FileSelector
                    :extensions="['jpg', 'png']"
                    v-model="formData.image"
                />
            </div>
        </div>
        <VideoMergeImageParamForm ref="paramForm" />
        <div class="flex">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                <icon-send class="mr-2" />
                {{ "提交任务" }}
            </a-button>
        </div>
    </div>
</template>
