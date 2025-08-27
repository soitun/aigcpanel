<script setup lang="ts">
import {ref} from "vue";
import {dataAutoSaveDraft} from "../../../../components/common/util";
import {t} from "../../../../lang";
import {Dialog} from "../../../../lib/dialog";
import {TaskRecord, TaskService} from "../../../../service/TaskService";
import SoundAsrForm from "../../../Sound/components/SoundAsrForm.vue";
import SoundGenerateForm from "../../../Sound/components/SoundGenerateForm.vue";

const emit = defineEmits<{
    submitted: [];
}>();

const soundAsrForm = ref<InstanceType<typeof SoundAsrForm>>();
const soundGenerateForm = ref<InstanceType<typeof SoundGenerateForm> | null>(null);
const formData = ref({
    video: "",
});

const {clearDraft} = dataAutoSaveDraft("SoundReplaceCreate.formData", formData.value);

const onSelectAudioFile = async () => {
    try {
        const filePath = await window.$mapi.file.openFile({
            title: t("选择视频文件"),
            filters: [{name: t("视频文件"), extensions: ["mp4"]}],
        });

        if (filePath) {
            formData.value.video = filePath;
        }
    } catch (error) {
        Dialog.tipError(t("文件选择失败"));
    }
};

const doSubmit = async () => {
    const soundAsrValue = await soundAsrForm.value?.getValue();
    if (!soundAsrValue) {
        return;
    }
    const soundGenerateValue = await soundGenerateForm.value?.getValue();
    if (!soundGenerateValue) {
        return;
    }
    if (!formData.value.video) {
        Dialog.tipError(t("请选择视频文件"));
        return;
    }
    if (isSubmitting.value) {
        return;
    }
    isSubmitting.value = true;
    try {
        const taskTitle = window.$mapi.file.pathToName(formData.value.video, false);
        const record: TaskRecord = {
            biz: "SoundReplace",
            title: taskTitle,
            serverName: "",
            serverTitle: "",
            serverVersion: "",
            modelConfig: {
                video: formData.value.video,
                soundAsr: soundAsrValue,
                soundGenerate: soundGenerateValue,
            },
            param: {},
        };
        await TaskService.submit(record);
        formData.value.video = "";
        emit("submitted");
        Dialog.tipSuccess(t("语音识别任务已提交"));
        clearDraft();
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
                <a-tooltip :content="$t('视频文件')" mini>
                    <i class="iconfont icon-video"></i>
                </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <a-tooltip v-if="formData.video" :content="formData.video" mini>
                    <div
                        class="flex-grow text-sm text-black rounded-lg leading-7 min-w-64 px-3 min-h-7 border border-gray-500 cursor-default select-none">
                        <icon-file/>
                        {{ formData.video.split("/").pop() || formData.video.split("\\").pop() }}
                    </div>
                </a-tooltip>
                <a-button @click="onSelectAudioFile" class="flex-grow w-64">
                    <i class="iconfont icon-upload mr-2"></i>
                    {{ formData.video ? t("重新选择") : t("选择视频文件") }}({{ t("支持MP4格式") }})
                </a-button>
            </div>
        </div>
        <SoundAsrForm ref="soundAsrForm"/>
        <SoundGenerateForm ref="soundGenerateForm"/>
        <div class="flex">
            <a-button class="mr-2" type="primary" @click="doSubmit" :loading="isSubmitting">
                <i class="iconfont icon-submit mr-2"></i>
                {{ t("提交任务") }}
            </a-button>
        </div>
    </div>
</template>
