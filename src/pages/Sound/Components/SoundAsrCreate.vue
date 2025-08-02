<script setup lang="ts">
import { onMounted, ref } from "vue";
import { t } from "../../../lang";
import { contentToFilenamePathPart } from "../../../lib/aigcpanel";
import { Dialog } from "../../../lib/dialog";
import { PermissionService } from "../../../service/PermissionService";
import { TaskRecord, TaskService } from "../../../service/TaskService";
import SoundAsrForm from "./SoundAsrForm.vue";

const emit = defineEmits<{
    submitted: [];
}>();

const soundAsrForm = ref<InstanceType<typeof SoundAsrForm>>();
const formData = ref({
    audioFilePath: "",
});

onMounted(async () => {
    // No need to load title from storage since it's auto-generated from filename
});

const onSelectAudioFile = async () => {
    try {
        const filePath = await window.$mapi.file.openFile({
            title: t("选择音频文件"),
            filters: [{ name: t("音频文件"), extensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac"] }],
        });

        if (filePath) {
            formData.value.audioFilePath = filePath;
        }
    } catch (error) {
        Dialog.tipError(t("文件选择失败"));
    }
};

const doSubmit = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;

    try {
        const value = await soundAsrForm.value?.getValue();
        if (!value) {
            return;
        }

        if (!formData.value.audioFilePath) {
            Dialog.tipError(t("请选择音频文件"));
            return;
        }

        // Generate task title from audio filename
        const fileName =
            formData.value.audioFilePath.split("/").pop() || formData.value.audioFilePath.split("\\").pop() || "";
        const taskTitle = contentToFilenamePathPart(fileName.replace(/\.[^/.]+$/, ""), 20) || t("语音识别任务");

        // Save audio file to hub
        const audioPath = await window.$mapi.file.hubSave(formData.value.audioFilePath, {
            isFullPath: true,
            returnFullPath: true,
        });

        const record: TaskRecord = {
            biz: "SoundAsr",
            title: taskTitle,
            serverName: value.serverName,
            serverTitle: value.serverTitle,
            serverVersion: value.serverVersion,
            modelConfig: {
                type: value.type,
                serverKey: value.serverKey,
                param: value.param,
                audioFile: audioPath,
            },
            param: {
                audioFile: audioPath,
            },
        };

        if (!(await PermissionService.checkForTask(value.type, record))) {
            return;
        }

        await TaskService.submit(record);

        // Reset form
        formData.value.audioFilePath = "";

        emit("submitted");
        Dialog.tipSuccess(t("语音识别任务已提交"));
    } finally {
        isSubmitting.value = false;
    }
};

const isSubmitting = ref(false);
</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <SoundAsrForm ref="soundAsrForm" />
        <div class="pt-4">
            <div v-if="formData.audioFilePath" class="mb-2 text-sm text-gray-600">
                <i class="iconfont icon-file mr-1"></i>
                {{ formData.audioFilePath.split("/").pop() || formData.audioFilePath.split("\\").pop() }}
            </div>
            <a-button type="outline" @click="onSelectAudioFile" class="w-96 max-w-full">
                <i class="iconfont icon-upload mr-2"></i>
                {{ formData.audioFilePath ? t("重新选择") : t("选择音频文件") }}
            </a-button>
        </div>
        <div class="pt-4 flex">
            <a-button class="mr-2" type="primary" @click="doSubmit" :loading="isSubmitting">
                <i class="iconfont icon-submit mr-2"></i>
                {{ t("开始识别") }}
            </a-button>
        </div>
    </div>
</template>
