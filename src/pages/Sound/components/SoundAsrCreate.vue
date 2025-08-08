<script setup lang="ts">
import {ref} from "vue";
import {t} from "../../../lang";
import {Dialog} from "../../../lib/dialog";
import {PermissionService} from "../../../service/PermissionService";
import {TaskRecord, TaskService} from "../../../service/TaskService";
import SoundAsrForm from "./SoundAsrForm.vue";

const emit = defineEmits<{
    submitted: [];
}>();

const soundAsrForm = ref<InstanceType<typeof SoundAsrForm>>();
const formData = ref({
    audio: "",
});

const onSelectAudioFile = async () => {
    try {
        const filePath = await window.$mapi.file.openFile({
            title: t("选择音频文件"),
            filters: [{name: t("音频文件"), extensions: ["mp3", "wav"]}],
        });

        if (filePath) {
            formData.value.audio = filePath;
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

        if (!formData.value.audio) {
            Dialog.tipError(t("请选择音频文件"));
            return;
        }

        // Generate task title from audio filename
        const taskTitle = window.$mapi.file.pathToName(formData.value.audio, false);

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
                audio: formData.value.audio,
            },
            param: {},
        };

        if (!(await PermissionService.checkForTask(value.type, record))) {
            return;
        }

        await TaskService.submit(record);

        // Reset form
        formData.value.audio = "";

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
        <div class="mb-4 flex items-start">
            <div class="mr-1 pt-1">
                <a-tooltip :content="$t('声音文件')" mini>
                    <i class="iconfont icon-sound"></i>
                </a-tooltip>
            </div>
            <div>
                <div v-if="formData.audio" class="mb-2 text-sm text-gray-600">
                    <i class="iconfont icon-file mr-1"></i>
                    {{ formData.audio.split("/").pop() || formData.audio.split("\\").pop() }}
                </div>
                <a-button @click="onSelectAudioFile" class="w-96 max-w-full">
                    <i class="iconfont icon-upload mr-2"></i>
                    {{ formData.audio ? t("重新选择") : t("选择音频文件") }}({{ t("支持MP3、WAV格式") }})
                </a-button>
            </div>
        </div>
        <SoundAsrForm ref="soundAsrForm" />
        <div class="flex">
            <a-button class="mr-2" type="primary" @click="doSubmit" :loading="isSubmitting">
                <i class="iconfont icon-submit mr-2"></i>
                {{ t("开始识别") }}
            </a-button>
        </div>
    </div>
</template>
