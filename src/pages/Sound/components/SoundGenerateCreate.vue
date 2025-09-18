<script setup lang="ts">
import {onMounted, ref} from "vue";
import {StorageUtil} from "../../../lib/storage";
import SoundGenerateForm from "./SoundGenerateForm.vue";
import BatchTextareaInputAction from "../../../components/BatchTextareaInputAction.vue";
import {Dialog} from "../../../lib/dialog";
import {t} from "../../../lang";
import {TaskRecord, TaskService} from "../../../service/TaskService";
import {PermissionService} from "../../../service/PermissionService";
import ModelGenerateButton from "../../../module/Model/ModelGenerateButton.vue";
import ModelAgentButton from "../../../module/Model/ModelAgentButton.vue";
import {SoundGenerateTextPrompt} from "../config/prompt";

const soundGenerateForm = ref<InstanceType<typeof SoundGenerateForm>>();
const formData = ref({
    text: "",
});

onMounted(async () => {
    const old = StorageUtil.getObject("SoundGenerateCreate.formData");
    formData.value.text = old.text || "";
});

const doSubmit = async () => {
    const value = await soundGenerateForm.value?.getValue();
    if (!value) {
        return;
    }
    if (!formData.value.text) {
        Dialog.tipError(t("请输入合成内容"));
        return;
    }
    const record: TaskRecord = {
        biz: "SoundGenerate",
        title: await window.$mapi.file.textToName(formData.value.text),
        serverName: value.serverName,
        serverTitle: value.serverTitle,
        serverVersion: value.serverVersion,
        modelConfig: {
            type: value.type,
            ttsServerKey: value.ttsServerKey,
            ttsParam: value.ttsParam,
            cloneServerKey: value.cloneServerKey,
            cloneParam: value.cloneParam,
            promptId: value.promptId,
            promptTitle: value.promptTitle,
            promptUrl: value.promptUrl,
            promptText: value.promptText,
            text: formData.value.text,
        },
    };
    if (!(await PermissionService.checkForTask(value.type, record))) {
        return;
    }
    const id = await TaskService.submit(record);
    formData.value.text = "";
    Dialog.tipSuccess(t("任务已经提交成功，等待克隆完成"));
    emit("submitted");
};

const doSubmitBatch = async (records: { text: string }[]) => {
    const value = await soundGenerateForm.value?.getValue();
    if (!value) {
        return;
    }
    for (const r of records) {
        const record: TaskRecord = {
            biz: "SoundGenerate",
            title: await window.$mapi.file.textToName(r.text),
            serverName: value.serverName,
            serverTitle: value.serverTitle,
            serverVersion: value.serverVersion,
            modelConfig: {
                type: value.type,
                ttsServerKey: value.ttsServerKey,
                ttsParam: value.ttsParam,
                cloneServerKey: value.cloneServerKey,
                cloneParam: value.cloneParam,
                promptId: value.promptId,
                promptTitle: value.promptTitle,
                promptUrl: value.promptUrl,
                promptText: value.promptText,
                text: r.text,
            },
        };
        if (!(await PermissionService.checkForTask(value.type, record))) {
            return;
        }
        await TaskService.submit(record);
    }
    Dialog.tipSuccess(t("任务已经提交成功，等待克隆完成"));
    emit("submitted");
};

const emit = defineEmits({
    submitted: () => true,
});
</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <div class="mb-2">
            <a-textarea
                v-model="formData.text"
                :auto-size="{minRows: 2}"
                :placeholder="$t('输入语音内容开始合成')"
            ></a-textarea>
        </div>
        <SoundGenerateForm ref="soundGenerateForm"/>
        <div class="flex">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t("开始合成") }}
            </a-button>
            <BatchTextareaInputAction
                :text="$t('批量文本合成')"
                :confirm-text="$t('提交合成')"
                @submit="doSubmitBatch"
            />
            <ModelAgentButton biz="SoundGenerateTextPrompt" :prompt-default="SoundGenerateTextPrompt"/>
        </div>
    </div>
</template>
